import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PermissionDeniedException } from '../exceptions';
import { IResponse } from '../../../../common/interfaces/response.interface';

/**
 * CASL 异常过滤器
 * 统一处理权限相关的异常，提供友好的错误响应
 */
@Catch(PermissionDeniedException)
export class CaslExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CaslExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: PermissionDeniedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.FORBIDDEN;

    // 判断是否为生产环境
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    // 构建统一格式的错误响应
    const errorResponse: IResponse = {
      code: status,
      data: null,
      message: '权限不足',
      success: false,
    };

    // 开发环境提供详细信息
    if (!isProduction) {
      (errorResponse as any).details = {
        action: exception.action,
        subject: exception.subject,
        userId: exception.userId,
        path: request.url,
        method: request.method,
      };
    }

    // 记录日志
    this.logger.warn(
      `权限拒绝: userId=${exception.userId}, action=${exception.action}, subject=${exception.subject}, path=${request.url}`,
    );

    response.status(status).json(errorResponse);
  }
}
