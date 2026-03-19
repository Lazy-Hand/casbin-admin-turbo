import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { IResponse } from '../interfaces/response.interface';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let code: number;
    let message: string;

    if (exception instanceof BusinessException) {
      // 处理业务异常
      status = exception.getStatus();
      code = exception.getBusinessCode();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
    } else if (exception instanceof HttpException) {
      // 处理 HTTP 异常
      status = exception.getStatus();
      code = status;
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
    } else {
      // 处理未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 500;
      message = 'Internal server error';
    }

    const errorResponse: IResponse = {
      code: code,
      data: null,
      message: message,
      success: false,
    };

    response.status(status).json(errorResponse);
  }
}
