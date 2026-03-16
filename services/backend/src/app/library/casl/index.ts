/**
 * CASL 权限控制模块
 *
 * 提供基于 CASL 的 RBAC 权限控制系统
 *
 * 主要组件：
 * - CaslModule: 权限控制模块
 * - AbilityFactory: Ability 工厂
 * - UserHook: 用户钩子
 * - AbilityGuard: 权限守卫
 * - 装饰器: @Can, @CheckAbility, @Public 等
 * - 类型定义: AppAbility, UserWithPermissions 等
 * - 异常: PermissionDeniedException
 * - 过滤器: CaslExceptionFilter
 */

// 模块
export * from './casl.module';

// 工厂和钩子
export * from './ability.factory';
export * from './user.hook';

// 守卫
export * from './guards';

// 装饰器
export * from './decorators';

// 类型定义
export * from './types';

// 异常
export * from './exceptions';

// 过滤器
export * from './filters';
