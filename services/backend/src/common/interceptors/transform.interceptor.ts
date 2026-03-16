import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResponse } from '../interfaces/response.interface';
import {
  RESPONSE_MESSAGE_KEY,
  RESPONSE_CODE_KEY,
} from '../decorators/response.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  IResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    // 从装饰器获取自定义消息和状态码
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );
    const customCode = this.reflector.get<number>(
      RESPONSE_CODE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是统一格式，直接返回
        if (this.isIResponse(data)) {
          return data;
        }

        // 包装为统一格式，使用自定义值或默认值
        return {
          code: customCode ?? 200,
          data: data,
          message: customMessage ?? 'success',
          success: true,
        };
      }),
    );
  }

  private isIResponse(data: any): data is IResponse {
    return (
      data &&
      typeof data === 'object' &&
      'code' in data &&
      'data' in data &&
      'message' in data &&
      'success' in data
    );
  }
}
