import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../ability.factory';
import { UserHook } from '../user.hook';
import { CHECK_ABILITY_KEY, CHECK_POLICIES_KEY } from '../decorators';
import { IS_PUBLIC_KEY } from '../../../system/auth/decorators/public.decorator';
import { PermissionDeniedException } from '../exceptions';
import type { RequiredRule, PolicyHandler } from '../types';

/**
 * Ability Guard
 * 权限守卫，在请求到达控制器前进行权限检查
 *
 * 执行流程：
 * 1. 检查是否为公开端点（@Public）
 * 2. 提取权限要求（@CheckAbility, @Can 等）
 * 3. 从请求中提取用户信息
 * 4. 使用 UserHook 加载用户完整权限信息
 * 5. 使用 AbilityFactory 创建 Ability 实例
 * 6. 检查用户是否满足所有权限要求
 * 7. 返回检查结果或抛出 403 错误
 */
@Injectable()
export class AbilityGuard implements CanActivate {
  private readonly logger = new Logger(AbilityGuard.name);
  private readonly logPermissions: boolean;

  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
    private userHook: UserHook,
    private configService: ConfigService,
  ) {
    this.logPermissions = this.configService.get<boolean>('casl.logging.logPermissions', false);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 检查是否为公开端点
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. 获取权限要求
    const rules = this.reflector.getAllAndOverride<RequiredRule[]>(CHECK_ABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const policies = this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 没有权限要求，允许访问
    if ((!rules || rules.length === 0) && (!policies || policies.length === 0)) {
      return true;
    }

    // 3. 获取当前用户
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      this.logger.warn('用户未认证，拒绝访问');
      throw new ForbiddenException('用户未认证');
    }

    // 4. 加载用户完整信息
    const user = await this.userHook.run(userId);

    if (!user) {
      this.logger.warn(`用户不存在: userId=${userId}`);
      throw new ForbiddenException('用户不存在');
    }

    // 5. 创建 Ability 实例
    const ability = await this.abilityFactory.createForUser(user);

    // 6. 检查权限要求
    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const { action, subject, conditions, resourceParam } = rule;

        // 条件权限检查
        if (conditions && resourceParam) {
          const resource = this.extractResource(request, resourceParam);
          if (!ability.can(action, subject, resource)) {
            this.logger.warn(
              `权限检查失败: userId=${userId}, action=${action}, subject=${subject}, resource=${JSON.stringify(resource)}`,
            );
            throw new PermissionDeniedException(action, subject, userId, {
              conditions,
              resource,
            });
          }
        } else {
          // 基本权限检查
          if (!ability.can(action, subject)) {
            this.logger.warn(
              `权限检查失败: userId=${userId}, action=${action}, subject=${subject}`,
            );
            throw new PermissionDeniedException(action, subject, userId);
          }
        }
      }
    }

    // 7. 检查策略
    if (policies && policies.length > 0) {
      for (const policy of policies) {
        if (!policy.handle(ability)) {
          this.logger.warn(`策略检查失败: userId=${userId}, policy=${policy.constructor.name}`);
          throw new PermissionDeniedException('custom', 'policy', userId, {
            policyName: policy.constructor.name,
          });
        }
      }
    }

    // 将 ability 实例和用户信息附加到请求对象，供后续使用
    request.ability = ability;
    request.userWithPermissions = user;

    if (this.logPermissions) {
      this.logger.debug(`权限检查通过: userId=${userId}`);
    }
    return true;
  }

  /**
   * 从请求中提取资源实例
   * @param request 请求对象
   * @param paramName 参数名称
   * @returns 资源实例
   */
  private extractResource(request: any, paramName: string): any {
    if (!paramName) {
      return null;
    }

    // 从路径参数、查询参数或请求体中提取资源
    return request.params[paramName] || request.query[paramName] || request.body[paramName];
  }
}
