import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { asyncLocalStorage } from '../../app/library/prisma/user-context';

/**
 * 用户上下文拦截器
 * 将当前请求的用户 ID 存储到 AsyncLocalStorage 中
 * 供 Prisma middleware 使用，自动设置 createdBy/updatedBy
 */
@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // 如果没有用户信息（如公开接口），则不设置上下文
    if (!userId) {
      return next.handle();
    }

    // 使用 AsyncLocalStorage 存储用户 ID
    return new Observable((subscriber) => {
      asyncLocalStorage.run({ userId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
