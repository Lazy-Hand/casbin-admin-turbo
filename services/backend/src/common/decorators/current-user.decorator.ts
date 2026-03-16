import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '../types/user.types';

/**
 * 获取当前登录用户装饰器
 * 从 request.user 中提取用户信息
 *
 * @example
 * // 获取完整用户对象
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return user;
 * }
 *
 * @example
 * // 只获取用户ID
 * @Get('my-posts')
 * getMyPosts(@CurrentUser('id') userId: number) {
 *   return this.postService.findByUserId(userId);
 * }
 *
 * @example
 * // 获取用户名
 * @Get('welcome')
 * welcome(@CurrentUser('username') username: string) {
 *   return `Welcome, ${username}!`;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果没有指定字段，返回整个用户对象
    if (!data) {
      return user;
    }

    // 返回指定字段
    return user?.[data];
  },
);
