import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from '@casl/ability';
import { PermissionService } from '../../system/permission/permission.service';
import type { AppAbility, UserWithPermissions, Action, Subject } from './types';
import type { ParsedPermission } from './types';

/**
 * Ability Factory
 * 负责根据用户信息创建 CASL Ability 实例
 * 将数据库中的权限配置转换为 CASL 规则
 */
@Injectable()
export class AbilityFactory {
  constructor(private permissionService: PermissionService) {}

  /**
   * 为用户创建 Ability 实例
   * @param user 用户完整信息（包含角色和权限）
   * @returns CASL Ability 实例
   */
  async createForUser(user: UserWithPermissions): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    // 加载用户权限
    const permissions = await this.permissionService.getUserPermissions(
      user.id,
    );

    // 根据权限定义规则
    for (const permission of permissions) {
      const parsed = this.parsePermission(permission.permCode);

      if (parsed) {
        // 基本权限规则（无条件）
        can(parsed.action, parsed.subject);
      }
    }

    // 应用角色特殊规则
    this.applyRoleSpecificRules(user, can, cannot);

    return build({
      detectSubjectType: (item) => item.constructor.name,
    }) as AppAbility;
  }

  /**
   * 解析权限代码
   * 格式：{resource}:{action}
   * 例如：article:read, user:update, comment:delete
   * @param permCode 权限代码
   * @returns 解析后的权限对象
   */
  private parsePermission(permCode: string): ParsedPermission | null {
    // 处理特殊的权限代码格式
    if (permCode.startsWith('menu:')) {
      // 菜单权限：menu:dashboard -> read Dashboard
      const menuName = permCode.substring(5);
      return {
        action: 'read',
        subject: this.capitalize(menuName),
      };
    }

    if (permCode.startsWith('button:')) {
      // 按钮权限：button:export -> export all
      const buttonAction = permCode.substring(7);
      return {
        action: buttonAction,
        subject: 'all',
      };
    }

    // 标准格式：resource:action
    const parts = permCode.split(':');
    if (parts.length === 2) {
      const [subject, action] = parts;
      return {
        action,
        subject: this.capitalize(subject),
      };
    }

    // 无法解析的权限代码
    return null;
  }

  /**
   * 应用角色特殊规则
   * @param user 用户信息
   * @param can 允许规则构建器
   * @param cannot 禁止规则构建器
   */
  private applyRoleSpecificRules(
    user: UserWithPermissions,
    can: any,
    cannot: any,
  ): void {
    const roleCodes = user.roles.map((role) => role.roleCode);

    // 管理员拥有所有权限
    if (roleCodes.includes('admin')) {
      can('manage', 'all');
      return;
    }

    // 普通用户的条件权限
    if (roleCodes.includes('user')) {
      // 用户只能修改自己创建的文章
      can('update', 'Article', { authorId: user.id });
      can('delete', 'Article', { authorId: user.id });

      // 用户只能修改自己的评论
      can('update', 'Comment', { userId: user.id });
      can('delete', 'Comment', { userId: user.id });
    }

    // 编辑者角色
    if (roleCodes.includes('editor')) {
      // 编辑者可以管理所有文章
      can('manage', 'Article');
      // 但不能删除
      cannot('delete', 'Article');
    }

    // 审核者角色
    if (roleCodes.includes('moderator')) {
      // 审核者可以审核和发布内容
      can('approve', 'Article');
      can('publish', 'Article');
      can('approve', 'Comment');
    }
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
}
