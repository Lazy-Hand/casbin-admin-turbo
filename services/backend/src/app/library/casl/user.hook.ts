import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import type {
  UserWithPermissions,
  RoleWithPermissions,
  PermissionInfo,
} from './types';

/**
 * User Hook
 * 负责从数据库加载用户的完整权限信息
 * 包括用户基本信息、所有角色及每个角色的所有权限
 */
@Injectable()
export class UserHook {
  constructor(private prisma: PrismaService) {}

  /**
   * 加载用户完整信息
   * @param userId 用户ID
   * @returns 包含用户信息、角色和权限的完整对象，如果用户不存在则返回 null
   */
  async run(userId: number): Promise<UserWithPermissions | null> {
    // 从数据库查询用户及其关联的角色和权限
    const user = await this.prisma.user.findUnique({
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

    // 用户不存在
    if (!user) {
      return null;
    }

    // 转换数据结构为 UserWithPermissions 格式
    const userWithPermissions: UserWithPermissions = {
      id: user.id,
      username: user.username,
      roles: user.roles.map((ur) => {
        const role = ur.role;
        const roleWithPermissions: RoleWithPermissions = {
          id: role.id,
          roleCode: role.roleCode,
          roleName: role.roleName,
          permissions: role.permissions.map((rp) => {
            const perm = rp.permission;
            const permissionInfo: PermissionInfo = {
              id: perm.id,
              permCode: perm.permCode,
              permName: perm.permName,
              resourceType: perm.resourceType as 'api' | 'menu' | 'button',
              method: perm.method,
              path: perm.path,
              menuType: perm.menuType || undefined,
            };
            return permissionInfo;
          }),
        };
        return roleWithPermissions;
      }),
    };

    return userWithPermissions;
  }
}
