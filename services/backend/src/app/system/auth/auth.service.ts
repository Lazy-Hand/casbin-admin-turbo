import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ResourceType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/app/library/redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type AuthenticatedUser = {
  id: number;
  username: string;
  email: string | null;
  mobile: string | null;
  gender: number | null;
  avatar: string | null;
  status: number;
  roles: Array<{
    id: number;
    roleName: string;
    roleCode: string;
    permissions: Array<{
      id: number;
      permName: string;
      permCode: string;
      method: string | null;
      resourceType: ResourceType;
      path: string | null;
    }>;
  }>;
  sid?: string;
};

type AuthSession = {
  sid: string;
  userId: number;
  username: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
};

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRES_IN: number;
  private readonly SESSION_TTL: number;
  private readonly SESSION_REFRESH_THRESHOLD: number;
  private readonly REDIS_USER_PREFIX = 'user:';
  private readonly REDIS_SESSION_PREFIX = 'auth:session:';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.JWT_EXPIRES_IN = this.configService.get<number>('jwt.expiresIn', 3600);
    this.SESSION_TTL = this.configService.get<number>('jwt.sessionTtl', 7200);
    this.SESSION_REFRESH_THRESHOLD = this.configService.get<number>(
      'jwt.sessionRefreshThreshold',
      Math.floor(this.SESSION_TTL / 4),
    );
  }

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;

    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      username: user.username,
    };
  }

  async login(
    loginDto: LoginDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const { username, password } = loginDto;
    const ip = context?.ip ?? '';
    const userAgent = context?.userAgent ?? '';

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      await this.recordLoginLog({
        username,
        status: 0,
        message: '用户名或密码错误',
        ip,
        userAgent,
      });
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginLog({
        userId: user.id,
        username,
        status: 0,
        message: '用户名或密码错误',
        ip,
        userAgent,
      });
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 记录登录成功日志
    await this.recordLoginLog({
      userId: user.id,
      username,
      status: 1,
      ip,
      userAgent,
    });

    const sessionId = randomUUID();
    const payload = { sub: user.id, username: user.username, sid: sessionId };
    const accessToken = this.jwtService.sign(payload);
    const loginTime = new Date();
    const expireAt = new Date(loginTime.getTime() + this.JWT_EXPIRES_IN * 1000);

    // 生成单 token，但会话有效性与滑动续期交给 Redis 管理
    const userInfo = this.buildUserInfo(user);
    const session = this.buildSession({
      sid: sessionId,
      userId: user.id,
      username: user.username,
      ip,
      userAgent,
      now: loginTime,
    });

    // 用户缓存用于减少数据库查询，会话 key 才是认证真相来源
    await Promise.all([
      this.cacheUserInfo(user.id, userInfo, this.SESSION_TTL),
      this.cacheSession(session, this.SESSION_TTL),
    ]);

    return {
      token: accessToken,
      expireAt: expireAt.toISOString(),
      loginTime: loginTime.toISOString(),
    };
  }

  /**
   * 校验 access token 对应的服务端会话，并在需要时自动续期
   */
  async validateAccessToken(payload: {
    sub: number;
    username: string;
    sid: string;
  }): Promise<AuthenticatedUser> {
    const { sub: userId, sid } = payload;
    const session = await this.getSessionFromCache(sid);

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const userInfo = await this.loadUserProfile(userId);
    await this.refreshSessionActivity(session, userInfo);

    return {
      ...userInfo,
      sid,
    };
  }

  async getProfile(user: { id: number }): Promise<AuthenticatedUser> {
    return this.loadUserProfile(user.id);
  }

  /**
   * 登出（清除 Redis 会话和用户缓存）
   */
  async logout(user: { id: number; sid?: string }): Promise<void> {
    const keys = [this.getUserCacheKey(user.id)];

    if (user.sid) {
      keys.push(this.getSessionCacheKey(user.sid));
    }

    await this.redisService.del(...keys);
  }

  /**
   * 缓存用户信息到 Redis
   */
  private async cacheUserInfo(
    userId: number,
    userInfo: AuthenticatedUser,
    ttl: number,
  ): Promise<void> {
    const key = this.getUserCacheKey(userId);
    await this.redisService.set(key, userInfo, ttl);
  }

  /**
   * 从 Redis 获取用户信息
   */
  private async getUserFromCache(
    userId: number,
  ): Promise<AuthenticatedUser | null> {
    const key = this.getUserCacheKey(userId);
    return await this.redisService.get(key);
  }

  private async cacheSession(session: AuthSession, ttl: number): Promise<void> {
    await this.redisService.set(this.getSessionCacheKey(session.sid), session, ttl);
  }

  private async getSessionFromCache(sid: string): Promise<AuthSession | null> {
    return this.redisService.get<AuthSession>(this.getSessionCacheKey(sid));
  }

  /**
   * 记录登录日志
   */
  private async recordLoginLog(data: {
    userId?: number;
    username: string;
    status: number;
    message?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.loginLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        status: data.status,
        message: data.message || null,
      },
    });
  }

  /**
   * 获取用户缓存 key
   */
  private getUserCacheKey(userId: number): string {
    return `${this.REDIS_USER_PREFIX}${userId}`;
  }

  private getSessionCacheKey(sid: string): string {
    return `${this.REDIS_SESSION_PREFIX}${sid}`;
  }

  private async loadUserProfile(userId: number): Promise<AuthenticatedUser> {
    const cachedUser = await this.getUserFromCache(userId);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const userInfo = this.buildUserInfo(user);
    await this.cacheUserInfo(userId, userInfo, this.SESSION_TTL);
    return userInfo;
  }

  private buildUserInfo(user: any): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      avatar: user.avatar,
      status: user.status,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        roleName: ur.role.roleName,
        roleCode: ur.role.roleCode,
        permissions: ur.role.permissions.map((rp) => ({
          id: rp.permission.id,
          permName: rp.permission.permName,
          permCode: rp.permission.permCode,
          method: rp.permission.method,
          resourceType: rp.permission.resourceType,
          path: rp.permission.path,
        })),
      })),
    };
  }

  private buildSession(params: {
    sid: string;
    userId: number;
    username: string;
    ip: string;
    userAgent: string;
    now: Date;
  }): AuthSession {
    const { sid, userId, username, ip, userAgent, now } = params;

    return {
      sid,
      userId,
      username,
      ip,
      userAgent,
      createdAt: now.toISOString(),
      lastActiveAt: now.toISOString(),
    };
  }

  private async refreshSessionActivity(
    session: AuthSession,
    userInfo: AuthenticatedUser,
  ): Promise<void> {
    const sessionKey = this.getSessionCacheKey(session.sid);
    const userKey = this.getUserCacheKey(userInfo.id);
    const [sessionTtl, userTtl] = await Promise.all([
      this.redisService.ttl(sessionKey),
      this.redisService.ttl(userKey),
    ]);

    const shouldRefreshSession =
      sessionTtl === -1 ||
      sessionTtl === -2 ||
      sessionTtl <= this.SESSION_REFRESH_THRESHOLD;
    const shouldRefreshUserCache =
      userTtl === -1 ||
      userTtl === -2 ||
      userTtl <= this.SESSION_REFRESH_THRESHOLD;

    if (!shouldRefreshSession && !shouldRefreshUserCache) {
      return;
    }

    const nextSession: AuthSession = {
      ...session,
      lastActiveAt: new Date().toISOString(),
    };

    const tasks: Promise<unknown>[] = [];

    if (shouldRefreshSession) {
      tasks.push(this.cacheSession(nextSession, this.SESSION_TTL));
    }

    if (shouldRefreshUserCache) {
      tasks.push(this.cacheUserInfo(userInfo.id, userInfo, this.SESSION_TTL));
    }

    await Promise.all(tasks);
  }

  /**
   * 批量清除用户缓存（用于权限变更时）
   */
  async clearUsersCacheByPattern(pattern: string = 'user:*'): Promise<number> {
    return await this.redisService.delByPattern(pattern);
  }

  /**
   * 获取当前用户的路由权限（resourceType=menu/button）
   */
  async getRoutePermissions(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: {
                    permission: {
                      resourceType: {
                        in: [ResourceType.menu, ResourceType.button],
                      },
                      deletedAt: null,
                      status: 1,
                    },
                  },
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const menuMap = new Map<
      number,
      {
        id: number;
        permName: string;
        permCode: string;
        path: string;
        icon: string;
        menuType: string | null;
        sort: number;
        cache: number;
        hidden: number;
        parentId: number | null;
        component: string;
        buttons: string[];
      }
    >();
    const menuButtonMap = new Map<number, Set<string>>();

    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        const p = rp.permission;
        if (p.resourceType === ResourceType.button) {
          if (p.parentId) {
            if (!menuButtonMap.has(p.parentId)) {
              menuButtonMap.set(p.parentId, new Set<string>());
            }
            const buttonPermCodes = menuButtonMap.get(p.parentId);
            buttonPermCodes?.add(p.permCode);
          }
          continue;
        }

        if (p.resourceType === ResourceType.menu && !menuMap.has(p.id)) {
          menuMap.set(p.id, {
            id: p.id,
            permName: p.permName,
            permCode: p.permCode,
            path: p.path ?? '',
            icon: p.icon ?? '',
            menuType: p.menuType,
            sort: p.sort,
            cache: p.cache,
            hidden: p.hidden,
            parentId: p.parentId ?? null,
            component: p.component ?? '',
            buttons: [],
          });
        }
      }
    }

    for (const [menuId, buttonPermCodes] of menuButtonMap) {
      const menu = menuMap.get(menuId);
      if (menu) {
        menu.buttons = Array.from(buttonPermCodes).sort((a, b) =>
          a.localeCompare(b),
        );
      }
    }

    // 返回扁平数组，由前端组装树形结构
    const list = Array.from(menuMap.values()).sort((a, b) => a.sort - b.sort);
    return list;
  }
}
