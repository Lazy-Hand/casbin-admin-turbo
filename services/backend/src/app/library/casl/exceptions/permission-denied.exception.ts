import { ForbiddenException } from '@nestjs/common';

/**
 * 权限拒绝异常
 * 当用户没有足够权限访问资源时抛出
 */
export class PermissionDeniedException extends ForbiddenException {
  constructor(
    public readonly action: string,
    public readonly subject: string,
    public readonly userId?: number,
    public readonly details?: unknown,
  ) {
    super({
      statusCode: 403,
      message: '权限不足',
      error: 'Forbidden',
      action,
      subject,
    });
  }
}
