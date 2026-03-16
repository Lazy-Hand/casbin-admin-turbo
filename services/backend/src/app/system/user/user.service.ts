import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { desc, eq } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UserRepository } from './repositories/user.repository';
import {
  Dept,
  DrizzleService,
  insertWithAudit,
  Post,
  Role,
  softDeleteWhere,
  updateWithAudit,
  User,
  UserRole,
  withSoftDelete,
} from '@/app/library/drizzle';

@Injectable()
export class UserService {
  constructor(
    private drizzle: DrizzleService,
    private userRepository: UserRepository,
  ) {}

  // 获取所有用户（带角色信息和部门信息）
  async findAll() {
    const rows = await this.drizzle.db
      .select({
        id: User.id,
        username: User.username,
        nickname: User.nickname,
        gender: User.gender,
        avatar: User.avatar,
        email: User.email,
        mobile: User.mobile,
        status: User.status,
        deptId: User.deptId,
        postId: User.postId,
        createdAt: User.createdAt,
        updatedAt: User.updatedAt,
        dept: {
          id: Dept.id,
          name: Dept.name,
        },
        post: {
          id: Post.id,
          postName: Post.postName,
        },
        role: {
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
        },
      })
      .from(User)
      .leftJoin(Dept, eq(User.deptId, Dept.id))
      .leftJoin(Post, eq(User.postId, Post.id))
      .leftJoin(UserRole, eq(User.id, UserRole.userId))
      .leftJoin(Role, eq(UserRole.roleId, Role.id))
      .where(withSoftDelete(User))
      .orderBy(desc(User.createdAt));

    const users = new Map<number, any>();

    for (const row of rows) {
      const current =
        users.get(row.id) ??
        {
          id: row.id,
          username: row.username,
          nickname: row.nickname,
          gender: row.gender,
          avatar: row.avatar,
          email: row.email,
          mobile: row.mobile,
          status: row.status,
          deptId: row.deptId,
          postId: row.postId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          dept: row.dept?.id ? row.dept : null,
          post: row.post?.id ? row.post : null,
          roles: [],
        };

      if (row.role?.id) {
        current.roles.push({ role: row.role });
      }

      users.set(row.id, current);
    }

    return [...users.values()];
  }

  // 获取用户详情
  async getUserDetail(userId: number, currentUserId?: number) {
    return this.userRepository.findOne(userId, currentUserId);
  }

  async create(dto: CreateUserDto) {
    const { roles, deptId, postId, ...userData } = dto;
    if (!userData.password) {
      throw new BadRequestException('密码不能为空');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 验证部门是否存在
    if (deptId) {
      const dept = await this.drizzle.findFirst(Dept, eq(Dept.id, deptId));
      if (!dept) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    // 验证岗位是否存在
    if (postId) {
      const post = await this.drizzle.findFirst(Post, eq(Post.id, postId));
      if (!post) {
        throw new BadRequestException('指定的岗位不存在');
      }
    }

    const result = await this.drizzle.db.transaction(async (tx: any) => {
      const createdUsers = await insertWithAudit(tx, User, {
          ...userData,
          password: hashedPassword,
          deptId,
          postId,
          isAdmin: false,
          updatedAt: new Date(),
      });
      const user = Array.isArray(createdUsers) ? createdUsers[0] : createdUsers;

      if (user && roles && roles.length > 0) {
        await tx.insert(UserRole).values(
          roles.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
        );
      }

      return user ?? null;
    });

    return result;
  }

  // 更新用户
  async update(id: number, dto: UpdateUserDto) {
    const { roles, deptId, postId, ...userData } = dto;
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    // 验证部门是否存在
    if (deptId !== undefined) {
      const dept = await this.drizzle.findFirst(Dept, eq(Dept.id, deptId));
      if (!dept) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    // 验证岗位是否存在
    if (postId !== undefined) {
      const post = await this.drizzle.findFirst(Post, eq(Post.id, postId));
      if (!post) {
        throw new BadRequestException('指定的岗位不存在');
      }
    }

    const result = await this.drizzle.db.transaction(async (tx: any) => {
      const updatedUsers = await updateWithAudit(tx, User, eq(User.id, id), {
          ...userData,
          ...(hashedPassword ? { password: hashedPassword } : {}),
          deptId,
          postId,
          gender: userData.gender !== undefined ? +userData.gender : undefined,
          status: userData.status !== undefined ? +userData.status : undefined,
      });
      const user = Array.isArray(updatedUsers) ? updatedUsers[0] : updatedUsers;

      if (roles !== undefined) {
        await tx.delete(UserRole).where(eq(UserRole.userId, id));

        if (roles.length > 0) {
          await tx.insert(UserRole).values(
            roles.map((roleId) => ({
              userId: id,
              roleId,
            })),
          );
        }
      }

      return user ?? null;
    });

    return result;
  }

  // 删除用户
  async delete(id: number) {
    return this.drizzle.db.transaction(async (tx: any) => {
      await tx.delete(UserRole).where(eq(UserRole.userId, id));
      const deletedUsers = await softDeleteWhere(tx, User, eq(User.id, id));
      return Array.isArray(deletedUsers) ? deletedUsers[0] ?? null : null;
    });
  }

  // 分页查询用户
  async findPage(dto: SearchUserDto, currentUserId?: number) {
    return this.userRepository.findPage(currentUserId, dto);
  }
}
