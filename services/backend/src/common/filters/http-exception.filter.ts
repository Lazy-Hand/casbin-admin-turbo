import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { IResponse } from "../interfaces/response.interface";
import { BusinessException } from "../exceptions/business.exception";

interface ExceptionResponseWithMessage {
  message: string | string[];
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let code: number;
    let message: string;
    let stack: string | undefined;

    if (exception instanceof BusinessException) {
      // 处理业务异常
      status = exception.getStatus();
      code = exception.getBusinessCode();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "object" && "message" in exceptionResponse
          ? String((exceptionResponse as ExceptionResponseWithMessage).message)
          : exception.message;
      stack = exception.stack;
    } else if (exception instanceof HttpException) {
      // 处理 HTTP 异常
      status = exception.getStatus();
      code = status;
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "object" && "message" in exceptionResponse
          ? String((exceptionResponse as ExceptionResponseWithMessage).message)
          : exception.message;
      stack = exception.stack;
    } else {
      // 处理未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 500;
      message = "Internal server error";
      stack = exception instanceof Error ? exception.stack : String(exception);
    }

    // 记录错误日志
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      stack,
      JSON.stringify({
        statusCode: status,
        code,
        path: ctx.getRequest()?.url,
        method: ctx.getRequest()?.method,
        timestamp: new Date().toISOString(),
      }),
    );

    const errorResponse: IResponse = {
      code: code,
      data: null,
      message: message,
      success: false,
    };

    response.status(status).json(errorResponse);
  }
}
