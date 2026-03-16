import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request } from 'express';
import { LogOperation } from '@prisma/client';
import { OperationLogService } from '@/app/system/operation-log/operation-log.service';
import { extractIp, extractUserAgent } from '@/common/utils/ip-extractor.util';
import { identifyModule } from '@/common/utils/module-mapper.util';
import { generateDescription } from '@/common/utils/description-generator.util';
import { simplifyParams } from '@/common/utils/sanitize.util';
import { UserEntity } from '@/app/system/user/entities/user.entity';

/**
 * 需要排除的路径前缀
 */
const EXCLUDED_PATHS = [
  '/api/auth',
  '/api/health',
  '/api/operation-logs',
  '/api/login-logs',
];

/**
 * 需要记录的 HTTP 方法
 */
const LOGGED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * 操作日志拦截器
 * 自动记录用户的增删改操作
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperationLogInterceptor.name);

  constructor(private readonly operationLogService: OperationLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: UserEntity }>();

    // 判断是否需要记录
    if (!this.shouldLog(request)) {
      return next.handle();
    }

    // 记录开始时间
    const startTime = Date.now();

    // 提取用户信息
    const user = request.user;
    const userId = user?.id;
    const username = user?.username || 'unknown';

    // 提取请求信息
    const method = request.method;
    const path = request.path;
    const module = identifyModule(path);
    const operation = this.getOperationType(method);

    return next.handle().pipe(
      tap((responseData) => {
        // 成功响应
        const duration = Date.now() - startTime;
        void this.logSuccess({
          userId,
          username,
          module,
          operation,
          method,
          path,
          request,
          response: responseData,
          duration,
          status: 1,
        });
      }),
      catchError((error: Error) => {
        // 错误响应
        const duration = Date.now() - startTime;
        void this.logError({
          userId,
          username,
          module,
          operation,
          method,
          path,
          request,
          error,
          duration,
          status: 0,
        });
        return throwError(() => error);
      }),
    );
  }

  /**
   * 判断是否需要记录日志
   */
  private shouldLog(request: Request): boolean {
    // 检查 HTTP 方法
    if (!LOGGED_METHODS.has(request.method)) {
      return false;
    }

    // 检查路径是否被排除
    const path = request.path;
    for (const excluded of EXCLUDED_PATHS) {
      if (path.startsWith(excluded)) {
        return false;
      }
    }

    // 检查是否是系统模块
    const module = identifyModule(path);
    return module !== 'unknown';
  }

  /**
   * 根据 HTTP 方法获取操作类型
   */
  private getOperationType(method: string): LogOperation {
    switch (method) {
      case 'POST':
        return LogOperation.CREATE;
      case 'PUT':
      case 'PATCH':
        return LogOperation.UPDATE;
      case 'DELETE':
        return LogOperation.DELETE;
      default:
        return LogOperation.CREATE;
    }
  }

  /**
   * 记录成功的操作
   */
  private async logSuccess(data: {
    userId?: number;
    username: string;
    module: string;
    operation: LogOperation;
    method: string;
    path: string;
    request: Request;
    response: any;
    duration: number;
    status: number;
  }) {
    try {
      const ip = extractIp(data.request);
      const userAgent = extractUserAgent(data.request);
      const params = this.extractParams(data.request);
      const sanitizedParams = simplifyParams(params, data.operation);
      const description = generateDescription(
        data.module,
        data.operation,
        data.response,
      );

      await this.operationLogService.pushLogQueue({
        userId: data.userId,
        username: data.username,
        module: data.module,
        operation: data.operation,
        description,
        method: data.method,
        path: data.path,
        params: sanitizedParams,
        ip,
        userAgent,
        status: data.status,
        duration: data.duration,
      });
    } catch (error) {
      this.logger.error('Failed to log operation:', error);
    }
  }

  /**
   * 记录失败的操作
   */
  private async logError(data: {
    userId?: number;
    username: string;
    module: string;
    operation: LogOperation;
    method: string;
    path: string;
    request: Request;
    error: Error;
    duration: number;
    status: number;
  }) {
    try {
      const ip = extractIp(data.request);
      const userAgent = extractUserAgent(data.request);
      const params = this.extractParams(data.request);
      const sanitizedParams = simplifyParams(params, data.operation);
      const result =
        data.error?.message || data.error?.toString() || 'Unknown error';

      await this.operationLogService.pushLogQueue({
        userId: data.userId,
        username: data.username,
        module: data.module,
        operation: data.operation,
        method: data.method,
        path: data.path,
        params: sanitizedParams,
        ip,
        userAgent,
        status: data.status,
        result,
        duration: data.duration,
      });
    } catch (error) {
      this.logger.error('Failed to log operation error:', error);
    }
  }

  /**
   * 从请求中提取参数
   */
  private extractParams(request: Request): any {
    // 对于 POST/PUT/PATCH，从 body 获取
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return request.body || {};
    }

    // 对于 DELETE，可能从 query 或 body 获取
    return {
      query: request.query || {},
      params: request.params || {},
    };
  }
}
