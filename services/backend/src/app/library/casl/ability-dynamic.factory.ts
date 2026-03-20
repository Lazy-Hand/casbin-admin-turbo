import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { and, eq } from 'drizzle-orm';
import type { AppAbility } from './types';
import type { Conditions } from './types/permission.types';
import {
  DrizzleService,
  joinOnWithSoftDelete,
  Permission,
  Role,
  RolePermission,
  UserRole,
  withSoftDelete,
} from '@/app/library/drizzle';

/**
 * 动态 Ability Factory
 * 完全基于数据库的权限配置，支持通过管理界面动态修改
 */
@Injectable()
export class AbilityDynamicFactory {
  constructor(private readonly drizzle: DrizzleService) {}

  /**
   * 为用户创建 Ability 实例（从数据库动态加载）
   * @param userId 用户 ID
   * @returns CASL Ability 实例
   */
  async createForUser(userId: number): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    // 从数据库加载用户的所有权限
    const rows = await this.drizzle.db
      .select({
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
      .from(UserRole)
      .innerJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .leftJoin(
        RolePermission,
        joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)),
      )
      .leftJoin(
        Permission,
        joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)),
      )
      .where(and(eq(UserRole.userId, userId), withSoftDelete(UserRole)));

    // 检查是否是管理员
    const isAdmin = rows.some((row) => row.role.roleCode === 'admin');
    if (isAdmin) {
      can('manage', 'all');
      return build({
        detectSubjectType: (item) => item.constructor.name,
      }) as AppAbility;
    }

    // 遍历所有角色的权限
    const seen = new Set<number>();
    for (const row of rows) {
      const permission = row.permission;
      if (!permission?.id || seen.has(permission.id)) {
        continue;
      }
      seen.add(permission.id);

      // 根据 resourceType 和 method 映射到 CASL 的 action 和 subject
      const action = this.mapToAction(
        permission.method,
        permission.resourceType,
        permission.permCode,
      );
      const subject = this.mapToSubject(permission.permCode);

      if (action && subject) {
        // 检查是否需要条件权限
        const conditions = this.getConditions(permission.permCode, permission.resourceType, userId);

        if (conditions) {
          can(action, subject, conditions);
        } else {
          can(action, subject);
        }
      }
    }

    return build({
      detectSubjectType: (item) => item.constructor.name,
    }) as AppAbility;
  }

  /**
   * 将 HTTP method 和 resourceType 映射到 CASL action
   * @param method HTTP 方法
   * @param resourceType 资源类型
   * @param permCode 权限代码
   * @returns CASL action
   */
  private mapToAction(
    method: string,
    resourceType: string | null,
    permCode: string,
  ): string | null {
    // API 权限映射
    if (resourceType === 'api') {
      const methodMap: Record<string, string> = {
        GET: 'read',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };
      return methodMap[method.toUpperCase()] || null;
    }

    // 菜单权限映射为 read
    if (resourceType === 'menu') {
      return 'read';
    }

    // 按钮权限从 permCode 中提取
    if (resourceType === 'button') {
      // 例如：article:approve -> approve
      //      comment:publish -> publish
      const parts = permCode.split(':');
      if (parts.length === 2) {
        return parts[1];
      }

      // 或者根据 method 判断
      const lowerMethod = method.toLowerCase();
      if (lowerMethod.includes('delete')) return 'delete';
      if (lowerMethod.includes('update') || lowerMethod.includes('edit')) return 'update';
      if (lowerMethod.includes('create') || lowerMethod.includes('add')) return 'create';
      if (lowerMethod.includes('approve')) return 'approve';
      if (lowerMethod.includes('publish')) return 'publish';

      return 'read';
    }

    return null;
  }

  /**
   * 将 permCode 映射到 CASL subject
   * @param permCode 权限代码
   * @returns CASL subject
   */
  private mapToSubject(permCode: string): string | null {
    // 处理特殊格式
    if (permCode.startsWith('menu:')) {
      // menu:dashboard -> Dashboard
      const menuName = permCode.substring(5);
      return this.capitalize(menuName);
    }

    if (permCode.startsWith('button:')) {
      // button:export -> all (按钮权限通常是全局的)
      return 'all';
    }

    // 标准格式：resource:action
    // 例如：article:read -> Article
    //      comment:create -> Comment
    //      user:update -> User
    const parts = permCode.split(':');
    if (parts.length >= 1) {
      const resource = parts[0];
      return this.capitalize(resource);
    }

    return null;
  }

  /**
   * 获取条件权限
   * @param permCode 权限代码
   * @param resourceType 资源类型
   * @param userId 用户 ID
   * @returns 条件对象或 null
   */
  private getConditions(permCode: string, resourceType: string | null, userId: number): Conditions | null {
    // 如果权限代码包含 :own，表示只能操作自己的资源
    if (permCode.includes(':own') || permCode.endsWith(':self')) {
      // 根据资源类型返回不同的条件字段
      if (permCode.startsWith('article:')) {
        return { authorId: userId };
      }
      if (permCode.startsWith('comment:')) {
        return { userId: userId };
      }
      if (permCode.startsWith('user:')) {
        return { id: userId };
      }
    }

    // 默认无条件
    return null;
  }

  /**
   * 首字母大写
   * @param str 字符串
   * @returns 首字母大写的字符串
   */
  private capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 检查用户是否有特定权限
   * @param userId 用户 ID
   * @param action 操作
   * @param subject 资源
   * @returns 是否有权限
   */
  async checkPermission(userId: number, action: string, subject: string): Promise<boolean> {
    const ability = await this.createForUser(userId);
    return ability.can(action, subject);
  }
}
