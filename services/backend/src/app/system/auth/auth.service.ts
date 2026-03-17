import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import * as bcrypt from "bcrypt"
import { randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { RedisService } from "@/app/library/redis/redis.service"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import {
  DrizzleService,
  LoginLog,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  insertWithAudit,
  joinOnWithSoftDelete,
  withSoftDelete,
} from "@/app/library/drizzle"
import type { MenuTypeValue, ResourceTypeValue } from "@/app/library/drizzle"

type AuthenticatedUser = {
  id: number
  username: string
  email: string | null
  mobile: string | null
  gender: number | null
  avatar: string | null
  status: number
  roles: Array<{
    id: number
    roleName: string
    roleCode: string
    permissions: Array<{
      id: number
      permName: string
      permCode: string
      method: string | null
      resourceType: ResourceTypeValue | null
      path: string | null
      menuType?: MenuTypeValue
      icon?: string
      sort?: number
      cache?: number
      hidden?: number
      parentId?: number | null
      component?: string
    }>
  }>
  sid?: string
}

type AuthSession = {
  sid: string
  userId: number
  username: string
  ip: string
  userAgent: string
  createdAt: string
  lastActiveAt: string
}

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRES_IN: number
  private readonly SESSION_TTL: number
  private readonly SESSION_REFRESH_THRESHOLD: number
  private readonly REDIS_USER_PREFIX = "user:"
  private readonly REDIS_SESSION_PREFIX = "auth:session:"

  constructor(
    private readonly drizzle: DrizzleService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.JWT_EXPIRES_IN = this.configService.get<number>("jwt.expiresIn", 3600)
    this.SESSION_TTL = this.configService.get<number>("jwt.sessionTtl", 7200)
    this.SESSION_REFRESH_THRESHOLD = this.configService.get<number>("jwt.sessionRefreshThreshold", Math.floor(this.SESSION_TTL / 4))
  }

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto

    const existingUser = await this.drizzle.findFirst(User, eq(User.username, username))

    if (existingUser) {
      throw new UnauthorizedException("用户名已存在")
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    const createdUsers = await insertWithAudit(this.drizzle.db, User, {
      username,
      password: hashedPassword,
      nickname: username,
      email: "",
      mobile: "",
      gender: 0,
      avatar: "",
      status: 1,
      isAdmin: false,
      updatedAt: new Date().toISOString(),
    })
    const user = Array.isArray(createdUsers) ? createdUsers[0] : createdUsers

    return {
      id: user?.id,
      username: user?.username,
    }
  }

  async login(loginDto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const { username, password } = loginDto
    const ip = context?.ip ?? ""
    const userAgent = context?.userAgent ?? ""

    // 查找用户
    const user = await this.loadAuthUserByUsername(username)

    if (!user) {
      await this.recordLoginLog({
        username,
        status: 0,
        message: "用户名或密码错误",
        ip,
        userAgent,
      })
      throw new UnauthorizedException("用户名或密码错误")
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      await this.recordLoginLog({
        userId: user.id,
        username,
        status: 0,
        message: "用户名或密码错误",
        ip,
        userAgent,
      })
      throw new UnauthorizedException("用户名或密码错误")
    }

    // 记录登录成功日志
    await this.recordLoginLog({
      userId: user.id,
      username,
      status: 1,
      ip,
      userAgent,
    })

    const sessionId = randomUUID()
    const payload = { sub: user.id, username: user.username, sid: sessionId }
    const accessToken = this.jwtService.sign(payload)
    const loginTime = new Date()
    const expireAt = new Date(loginTime.getTime() + this.JWT_EXPIRES_IN * 1000)

    // 生成单 token，但会话有效性与滑动续期交给 Redis 管理
    const userInfo = this.buildUserInfo(user)
    const session = this.buildSession({
      sid: sessionId,
      userId: user.id,
      username: user.username,
      ip,
      userAgent,
      now: loginTime,
    })

    // 用户缓存用于减少数据库查询，会话 key 才是认证真相来源
    await Promise.all([this.cacheUserInfo(user.id, userInfo, this.SESSION_TTL), this.cacheSession(session, this.SESSION_TTL)])

    return {
      token: accessToken,
      expireAt: expireAt.toISOString(),
      loginTime: loginTime.toISOString(),
    }
  }

  /**
   * 校验 access token 对应的服务端会话，并在需要时自动续期
   */
  async validateAccessToken(payload: { sub: number; username: string; sid: string }): Promise<AuthenticatedUser> {
    const { sub: userId, sid } = payload
    const session = await this.getSessionFromCache(sid)

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException("登录状态已失效，请重新登录")
    }

    const userInfo = await this.loadUserProfile(userId)
    await this.refreshSessionActivity(session, userInfo)

    return {
      ...userInfo,
      sid,
    }
  }

  async getProfile(user: { id: number }): Promise<AuthenticatedUser> {
    return this.loadUserProfile(user.id)
  }

  /**
   * 登出（清除 Redis 会话和用户缓存）
   */
  async logout(user: { id: number; sid?: string }): Promise<void> {
    const keys = [this.getUserCacheKey(user.id)]

    if (user.sid) {
      keys.push(this.getSessionCacheKey(user.sid))
    }

    await this.redisService.del(...keys)
  }

  /**
   * 缓存用户信息到 Redis
   */
  private async cacheUserInfo(userId: number, userInfo: AuthenticatedUser, ttl: number): Promise<void> {
    const key = this.getUserCacheKey(userId)
    await this.redisService.set(key, userInfo, ttl)
  }

  /**
   * 从 Redis 获取用户信息
   */
  private async getUserFromCache(userId: number): Promise<AuthenticatedUser | null> {
    const key = this.getUserCacheKey(userId)
    return await this.redisService.get(key)
  }

  private async cacheSession(session: AuthSession, ttl: number): Promise<void> {
    await this.redisService.set(this.getSessionCacheKey(session.sid), session, ttl)
  }

  private async getSessionFromCache(sid: string): Promise<AuthSession | null> {
    return this.redisService.get<AuthSession>(this.getSessionCacheKey(sid))
  }

  /**
   * 记录登录日志
   */
  private async recordLoginLog(data: { userId?: number; username: string; status: number; message?: string; ip?: string; userAgent?: string }): Promise<void> {
    await this.drizzle.db.insert(LoginLog).values({
      userId: data.userId,
      username: data.username,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      status: data.status,
      message: data.message || null,
    })
  }

  /**
   * 获取用户缓存 key
   */
  private getUserCacheKey(userId: number): string {
    return `${this.REDIS_USER_PREFIX}${userId}`
  }

  private getSessionCacheKey(sid: string): string {
    return `${this.REDIS_SESSION_PREFIX}${sid}`
  }

  private async loadUserProfile(userId: number): Promise<AuthenticatedUser> {
    const cachedUser = await this.getUserFromCache(userId)
    if (cachedUser) {
      return cachedUser
    }

    const user = await this.loadAuthUserById(userId)

    if (!user) {
      throw new UnauthorizedException("用户不存在")
    }

    const userInfo = this.buildUserInfo(user)
    await this.cacheUserInfo(userId, userInfo, this.SESSION_TTL)
    return userInfo
  }

  private buildUserInfo(user: {
    id: number
    username: string
    email: string | null
    mobile: string | null
    gender: number | null
    avatar: string | null
    status: number
    roles: Array<{
      id: number
      roleName: string
      roleCode: string
      permissions: Array<{
        id: number
        permName: string
        permCode: string
        method: string | null
        resourceType: ResourceTypeValue | null
        path: string | null
        menuType?: MenuTypeValue | null
        icon?: string | null
        sort?: number
        hidden?: number
        parentId?: number | null
        component?: string | null
      }>
    }>
  }): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      avatar: user.avatar,
      status: user.status,
      roles: user.roles.map((ur) => ({
        id: ur.id,
        roleName: ur.roleName,
        roleCode: ur.roleCode,
        permissions: ur.permissions.map((permission) => ({
          id: permission.id,
          permName: permission.permName,
          permCode: permission.permCode,
          method: permission.method,
          resourceType: permission.resourceType,
          path: permission.path,
        })),
      })),
    }
  }

  private buildSession(params: { sid: string; userId: number; username: string; ip: string; userAgent: string; now: Date }): AuthSession {
    const { sid, userId, username, ip, userAgent, now } = params

    return {
      sid,
      userId,
      username,
      ip,
      userAgent,
      createdAt: now.toISOString(),
      lastActiveAt: now.toISOString(),
    }
  }

  private async refreshSessionActivity(session: AuthSession, userInfo: AuthenticatedUser): Promise<void> {
    const sessionKey = this.getSessionCacheKey(session.sid)
    const userKey = this.getUserCacheKey(userInfo.id)
    const [sessionTtl, userTtl] = await Promise.all([this.redisService.ttl(sessionKey), this.redisService.ttl(userKey)])

    const shouldRefreshSession = sessionTtl === -1 || sessionTtl === -2 || sessionTtl <= this.SESSION_REFRESH_THRESHOLD
    const shouldRefreshUserCache = userTtl === -1 || userTtl === -2 || userTtl <= this.SESSION_REFRESH_THRESHOLD

    if (!shouldRefreshSession && !shouldRefreshUserCache) {
      return
    }

    const nextSession: AuthSession = {
      ...session,
      lastActiveAt: new Date().toISOString(),
    }

    const tasks: Promise<unknown>[] = []

    if (shouldRefreshSession) {
      tasks.push(this.cacheSession(nextSession, this.SESSION_TTL))
    }

    if (shouldRefreshUserCache) {
      tasks.push(this.cacheUserInfo(userInfo.id, userInfo, this.SESSION_TTL))
    }

    await Promise.all(tasks)
  }

  /**
   * 批量清除用户缓存（用于权限变更时）
   */
  async clearUsersCacheByPattern(pattern: string = "user:*"): Promise<number> {
    return await this.redisService.delByPattern(pattern)
  }

  /**
   * 获取当前用户的路由权限（resourceType=menu/button）
   */
  async getRoutePermissions(userId: number) {
    const user = await this.loadAuthUserById(userId, ["menu", "button"])

    if (!user) {
      throw new UnauthorizedException("用户不存在")
    }

    const menuMap = new Map<
      number,
      {
        id: number
        permName: string
        permCode: string
        path: string
        icon: string
        menuType: string | null
        sort: number
        cache: number
        hidden: number
        parentId: number | null
        component: string
        buttons: string[]
      }
    >()
    const menuButtonMap = new Map<number, Set<string>>()

    for (const role of user.roles) {
      for (const p of role.permissions) {
        if (p.resourceType === "button") {
          if (p.parentId) {
            if (!menuButtonMap.has(p.parentId)) {
              menuButtonMap.set(p.parentId, new Set<string>())
            }
            const buttonPermCodes = menuButtonMap.get(p.parentId)
            buttonPermCodes?.add(p.permCode)
          }
          continue
        }

        if (p.resourceType === "menu" && !menuMap.has(p.id)) {
          menuMap.set(p.id, {
            id: p.id,
            permName: p.permName,
            permCode: p.permCode,
            path: p.path ?? "",
            icon: p.icon ?? "",
            menuType: p.menuType ?? null,
            sort: p.sort ?? 0,
            cache: p.cache ?? 0,
            hidden: p.hidden ?? 0,
            parentId: p.parentId ?? null,
            component: p.component ?? "",
            buttons: [],
          })
        }
      }
    }

    for (const [menuId, buttonPermCodes] of menuButtonMap) {
      const menu = menuMap.get(menuId)
      if (menu) {
        menu.buttons = Array.from(buttonPermCodes).sort((a, b) => a.localeCompare(b))
      }
    }

    // 返回扁平数组，由前端组装树形结构
    const list = Array.from(menuMap.values()).sort((a, b) => a.sort - b.sort)
    return list
  }

  private async loadAuthUserByUsername(username: string, permissionTypes?: ResourceTypeValue[]) {
    const rows = await this.drizzle.db
      .select({
        id: User.id,
        username: User.username,
        password: User.password,
        email: User.email,
        mobile: User.mobile,
        gender: User.gender,
        avatar: User.avatar,
        status: User.status,
        role: {
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
        },
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          resourceType: Permission.resourceType,
          path: Permission.path,
          menuType: Permission.menuType,
          icon: Permission.icon,
          sort: Permission.sort,
          hidden: Permission.hidden,
          parentId: Permission.parentId,
          component: Permission.component,
          status: Permission.status,
        },
      })
      .from(User)
      .leftJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(User.id, UserRole.userId)))
      .leftJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .leftJoin(RolePermission, joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)))
      .leftJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
      .where(and(withSoftDelete(User), eq(User.username, username)))

    return this.groupAuthUser(rows, permissionTypes)
  }

  private async loadAuthUserById(userId: number, permissionTypes?: ResourceTypeValue[]) {
    const rows = await this.drizzle.db
      .select({
        id: User.id,
        username: User.username,
        password: User.password,
        email: User.email,
        mobile: User.mobile,
        gender: User.gender,
        avatar: User.avatar,
        status: User.status,
        role: {
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
        },
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          resourceType: Permission.resourceType,
          path: Permission.path,
          menuType: Permission.menuType,
          icon: Permission.icon,
          sort: Permission.sort,
          hidden: Permission.hidden,
          parentId: Permission.parentId,
          component: Permission.component,
          status: Permission.status,
        },
      })
      .from(User)
      .leftJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(User.id, UserRole.userId)))
      .leftJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .leftJoin(RolePermission, joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)))
      .leftJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
      .where(and(withSoftDelete(User), eq(User.id, userId)))

    return this.groupAuthUser(rows, permissionTypes)
  }

  private groupAuthUser(
    rows: Array<{
      id: number
      username: string
      password: string
      email: string
      mobile: string
      gender: number
      avatar: string
      status: number
      role: {
        id: number | null
        roleName: string | null
        roleCode: string | null
      } | null
      permission: {
        id: number | null
        permName: string | null
        permCode: string | null
        method: string | null
        resourceType: ResourceTypeValue | null
        path: string | null
        menuType: MenuTypeValue | null
        icon: string | null
        sort: number | null
        hidden: number | null
        parentId: number | null
        component: string | null
        status: number | null
      } | null
    }>,
    permissionTypes?: ResourceTypeValue[],
  ) {
    const first = rows[0]
    if (!first) {
      return null
    }

    const roles = new Map<number, AuthenticatedUser["roles"][number]>()

    for (const row of rows) {
      if (!row.role?.id) {
        continue
      }

      const currentRole = roles.get(row.role.id) ?? {
        id: row.role.id,
        roleName: row.role.roleName ?? "",
        roleCode: row.role.roleCode ?? "",
        permissions: [],
      }

      if (
        row.permission?.id &&
        row.permission.status === 1 &&
        (!permissionTypes || (row.permission.resourceType && permissionTypes.includes(row.permission.resourceType))) &&
        !currentRole.permissions.some((permission) => permission.id === row.permission!.id)
      ) {
        currentRole.permissions.push({
          id: row.permission.id,
          permName: row.permission.permName ?? "",
          permCode: row.permission.permCode ?? "",
          method: row.permission.method,
          resourceType: row.permission.resourceType,
          path: row.permission.path,
          menuType: row.permission.menuType ?? undefined,
          icon: row.permission.icon ?? undefined,
          sort: row.permission.sort ?? undefined,
          hidden: row.permission.hidden ?? undefined,
          parentId: row.permission.parentId ?? undefined,
          component: row.permission.component ?? undefined,
        } as any)
      }

      roles.set(row.role.id, currentRole)
    }

    return {
      id: first.id,
      username: first.username,
      password: first.password,
      email: first.email,
      mobile: first.mobile,
      gender: first.gender,
      avatar: first.avatar,
      status: first.status,
      roles: [...roles.values()],
    }
  }
}
