import { SetMetadata } from '@nestjs/common';
import type { PolicyHandler } from '../types';

/**
 * 策略检查元数据键
 */
export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * CheckPolicies 装饰器
 * 用于复杂的权限策略检查
 *
 * 支持传入自定义策略处理器，用于实现复杂的权限逻辑
 * 策略处理器需要实现 PolicyHandler 接口
 *
 * @param handlers 策略处理器数组
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 定义策略处理器
 * class CanApproveArticlePolicy implements PolicyHandler {
 *   handle(ability: AppAbility) {
 *     return ability.can('approve', 'Article');
 *   }
 * }
 *
 * // 使用装饰器
 * @CheckPolicies(new CanApproveArticlePolicy())
 * approveArticle() {
 *   // ...
 * }
 * ```
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
