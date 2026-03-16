import { SetMetadata } from '@nestjs/common';
import type { RequiredRule } from '../types';

/**
 * 权限检查元数据键
 */
export const CHECK_ABILITY_KEY = 'check_ability';

/**
 * CheckAbility 装饰器
 * 用于标记需要权限检查的端点，支持多个权限要求
 *
 * @param rules 权限要求规则数组
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @CheckAbility(
 *   { action: 'read', subject: 'Article' },
 *   { action: 'update', subject: 'Article' }
 * )
 * ```
 */
export const CheckAbility = (...rules: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITY_KEY, rules);

/**
 * Can 装饰器
 * 简化的权限检查装饰器，用于单个权限要求
 *
 * @param action 操作类型（如 'read', 'create', 'update', 'delete'）
 * @param subject 资源主体（如 'Article', 'User'）
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Can('read', 'Article')
 * findAll() {
 *   // ...
 * }
 * ```
 */
export const Can = (action: string, subject: string) =>
  CheckAbility({ action, subject });

/**
 * CanWithConditions 装饰器
 * 用于条件权限检查，需要从请求中提取资源实例
 *
 * @param action 操作类型
 * @param subject 资源主体
 * @param resourceParam 资源参数名称（从请求参数、查询参数或请求体中提取）
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @CanWithConditions('update', 'Article', 'id')
 * update(@Param('id') id: string) {
 *   // 会检查用户是否有权限更新指定 ID 的文章
 * }
 * ```
 */
export const CanWithConditions = (
  action: string,
  subject: string,
  resourceParam: string,
) => CheckAbility({ action, subject, conditions: true, resourceParam });
