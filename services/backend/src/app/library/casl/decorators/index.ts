/**
 * CASL 装饰器模块
 * 导出所有权限相关的装饰器
 */

export * from './ability.decorator';
export * from './check-policies.decorator';

// 重新导出 auth 模块的 Public 装饰器，避免重复定义
export {
  Public,
  IS_PUBLIC_KEY,
} from '../../../system/auth/decorators/public.decorator';
