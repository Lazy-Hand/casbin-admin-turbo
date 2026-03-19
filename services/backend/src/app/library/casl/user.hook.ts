import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { UserWithPermissions, RoleWithPermissions, PermissionInfo } from './types';
import {
  DrizzleService,
  joinOnWithSoftDelete,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  withSoftDelete,
} from '@/app/library/drizzle';

/**
 * User Hook
 * 负责从数据库加载用户的完整权限信息
 * 包括用户基本信息、所有角色及每个角色的所有权限
 */
@Injectable()
export class UserHook {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * 加载用户完整信息
   * @param userId 用户ID
   * @returns 包含用户信息、角色和权限的完整对象，如果用户不存在则返回 null
   */
  async run(userId: number): Promise<UserWithPermissions | null> {
    const rows = await this.drizzle.db
      .select({
        id: User.id,
        username: User.username,
        role: {
          id: Role.id,
          roleCode: Role.roleCode,
          roleName: Role.roleName,
        },
        permission: {
          id: Permission.id,
          permCode: Permission.permCode,
          permName: Permission.permName,
          resourceType: Permission.resourceType,
          method: Permission.method,
          path: Permission.path,
          menuType: Permission.menuType,
        },
      })
      .from(User)
      .leftJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(User.id, UserRole.userId)))
      .leftJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .leftJoin(
        RolePermission,
        joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)),
      )
      .leftJoin(
        Permission,
        joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)),
      )
      .where(and(withSoftDelete(User), eq(User.id, userId)));

    const first = rows[0];
    if (!first) {
      return null;
    }

    const roles = new Map<number, RoleWithPermissions>();

    for (const row of rows) {
      if (!row.role?.id) {
        continue;
      }

      const currentRole = roles.get(row.role.id) ?? {
        id: row.role.id,
        roleCode: row.role.roleCode ?? '',
        roleName: row.role.roleName ?? '',
        permissions: [],
      };

      if (
        row.permission?.id &&
        row.permission.resourceType &&
        !currentRole.permissions.some((permission) => permission.id === row.permission!.id)
      ) {
        const permissionInfo: PermissionInfo = {
          id: row.permission.id,
          permCode: row.permission.permCode ?? '',
          permName: row.permission.permName ?? '',
          resourceType: row.permission.resourceType,
          method: row.permission.method ?? '',
          path: row.permission.path ?? '',
          menuType: row.permission.menuType || undefined,
        };
        currentRole.permissions.push(permissionInfo);
      }

      roles.set(row.role.id, currentRole);
    }

    const userWithPermissions: UserWithPermissions = {
      id: first.id,
      username: first.username,
      roles: [...roles.values()],
    };

    return userWithPermissions;
  }
}
