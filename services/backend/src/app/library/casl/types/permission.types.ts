import { AppAbility } from './ability.types';

/**
 * CASL 条件类型
 * 用于定义资源实例的过滤条件
 */
export type Conditions = Record<string, unknown>;

/**
 * 权限要求规则接口
 * 用于装饰器中定义权限检查规则
 */
export interface RequiredRule {
  action: string;
  subject: string;
  conditions?: Conditions | boolean;
  resourceParam?: string;
}

/**
 * 策略处理器接口
 * 用于实现复杂的权限策略检查
 */
export interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}

/**
 * 权限解析结果接口
 * 用于解析 permCode 后的结果
 */
export interface ParsedPermission {
  action: string;
  subject: string;
  conditions?: Conditions;
}

/**
 * 权限缓存键接口
 * 用于生成和管理缓存键
 */
export interface PermissionCacheKey {
  userId: number;
  type: 'permissions' | 'roles';
}
