import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import {
  Dept,
  DrizzleService,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  withSoftDelete,
} from '@/app/library/drizzle';

@Injectable()
export class UserRepository {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  async findPage(
    userId: number | undefined,
    params: {
      pageNo?: number;
      pageSize?: number;
      deptId?: number;
      username?: string;
      status?: number;
      postId?: number;
    },
  ) {
    const { pageNo = 1, pageSize = 10, deptId, username, status, postId } = params;
    const skip = (pageNo - 1) * pageSize;

    const scopeCondition = await this.buildScopeCondition(userId);
    const where = and(
      withSoftDelete(User),
      deptId !== undefined ? eq(User.deptId, deptId) : undefined,
      postId !== undefined ? eq(User.postId, postId) : undefined,
      username ? ilike(User.username, `%${username}%`) : undefined,
      status !== undefined ? eq(User.status, status) : undefined,
      scopeCondition,
    );

    const [rows, totalRows] = await Promise.all([
      this.drizzle.db
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
          createdAt: User.createdAt,
          updatedAt: User.updatedAt,
          dept: {
            id: Dept.id,
            name: Dept.name,
          },
          role: {
            id: Role.id,
            roleName: Role.roleName,
            roleCode: Role.roleCode,
          },
        })
        .from(User)
        .leftJoin(Dept, eq(User.deptId, Dept.id))
        .leftJoin(UserRole, eq(User.id, UserRole.userId))
        .leftJoin(Role, eq(UserRole.roleId, Role.id))
        .where(where)
        .orderBy(desc(User.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({
          total: sql<number>`count(distinct ${User.id})`,
        })
        .from(User)
        .where(where),
    ]);

    return {
      list: this.groupUsersWithRoles(rows),
      total: totalRows[0]?.total ?? 0,
    };
  }

  async findOne(userId: number, currentUserId: number | undefined) {
    const scopeCondition = await this.buildScopeCondition(currentUserId);
    const rows = await this.drizzle.db
      .select({
        id: User.id,
        username: User.username,
        nickname: User.nickname,
        email: User.email,
        mobile: User.mobile,
        gender: User.gender,
        avatar: User.avatar,
        status: User.status,
        deptId: User.deptId,
        createdAt: User.createdAt,
        updatedAt: User.updatedAt,
        deletedAt: User.deletedAt,
        createdBy: User.createdBy,
        updatedBy: User.updatedBy,
        deletedBy: User.deletedBy,
        dept: {
          id: Dept.id,
          name: Dept.name,
        },
        role: {
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
          description: Role.description,
          status: Role.status,
          dataScope: Role.dataScope,
          customDepts: Role.customDepts,
          createdAt: Role.createdAt,
          updatedAt: Role.updatedAt,
          deletedAt: Role.deletedAt,
          createdBy: Role.createdBy,
          updatedBy: Role.updatedBy,
          deletedBy: Role.deletedBy,
        },
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          component: Permission.component,
          resourceType: Permission.resourceType,
          menuType: Permission.menuType,
          path: Permission.path,
          icon: Permission.icon,
          sort: Permission.sort,
          cache: Permission.cache,
          hidden: Permission.hidden,
          frameUrl: Permission.frameUrl,
          status: Permission.status,
          parentId: Permission.parentId,
          createdAt: Permission.createdAt,
          updatedAt: Permission.updatedAt,
          deletedAt: Permission.deletedAt,
          createdBy: Permission.createdBy,
          updatedBy: Permission.updatedBy,
          deletedBy: Permission.deletedBy,
        },
      })
      .from(User)
      .leftJoin(Dept, eq(User.deptId, Dept.id))
      .leftJoin(UserRole, eq(User.id, UserRole.userId))
      .leftJoin(Role, eq(UserRole.roleId, Role.id))
      .leftJoin(RolePermission, eq(Role.id, RolePermission.roleId))
      .leftJoin(Permission, eq(RolePermission.permissionId, Permission.id))
      .where(
        and(
          withSoftDelete(User, eq(User.id, userId)),
          scopeCondition,
        ),
      );

    if (rows.length === 0) {
      return null;
    }

    return this.groupUserDetail(rows);
  }

  private async buildScopeCondition(userId?: number) {
    if (!userId) {
      return undefined;
    }

    const config = await this.dataScopeService.getUserDataScope(userId, 'user');

    switch (config.scope) {
      case 'ALL':
        return undefined;
      case 'DEPT':
        return config.deptId ? eq(User.deptId, config.deptId) : eq(User.id, -1);
      case 'DEPT_AND_CHILD': {
        if (!config.deptId) {
          return eq(User.id, -1);
        }
        const deptIds = await this.dataScopeService.getDescendantDeptIds(config.deptId);
        return inArray(User.deptId, deptIds);
      }
      case 'CUSTOM':
        return config.customDepts?.length
          ? inArray(User.deptId, config.customDepts)
          : eq(User.id, -1);
      default:
        return undefined;
    }
  }

  private groupUsersWithRoles(rows: any[]) {
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
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          dept: row.dept?.id ? row.dept : null,
          roles: [],
        };

      if (row.role?.id && !current.roles.some((role: any) => role.id === row.role.id)) {
        current.roles.push(row.role);
      }

      users.set(row.id, current);
    }

    return [...users.values()];
  }

  private groupUserDetail(rows: any[]) {
    const first = rows[0];
    const roles = new Map<number, any>();

    for (const row of rows) {
      if (!row.role?.id) {
        continue;
      }

      const currentRole =
        roles.get(row.role.id) ??
        {
          ...row.role,
          permissions: [],
        };

      if (
        row.permission?.id &&
        !currentRole.permissions.some((permission: any) => permission.id === row.permission.id)
      ) {
        currentRole.permissions.push({
          permission: row.permission,
        });
      }

      roles.set(row.role.id, currentRole);
    }

    return {
      id: first.id,
      username: first.username,
      nickname: first.nickname,
      email: first.email,
      mobile: first.mobile,
      gender: first.gender,
      avatar: first.avatar,
      status: first.status,
      deptId: first.deptId,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
      deletedAt: first.deletedAt,
      createdBy: first.createdBy,
      updatedBy: first.updatedBy,
      deletedBy: first.deletedBy,
      dept: first.dept?.id ? first.dept : null,
      roles: [...roles.values()],
    };
  }
}
