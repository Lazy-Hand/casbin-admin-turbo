import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { IResponse } from '../interfaces/response.interface';

/**
 * 自定义 Swagger 响应装饰器
 * 自动包装实体类为统一响应格式
 */
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: {
    description?: string;
    isArray?: boolean;
  },
) => {
  const { description = 'Success', isArray = false } = options || {};

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          {
            properties: {
              code: {
                type: 'number',
                example: 200,
                description: '业务状态码',
              },
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : {
                    $ref: getSchemaPath(model),
                  },
              message: {
                type: 'string',
                example: 'success',
                description: '响应消息',
              },
              success: {
                type: 'boolean',
                example: true,
                description: '是否成功',
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * 分页响应装饰器
 * 自动包装实体类为统一分页响应格式
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: {
    description?: string;
  },
) => {
  const { description = 'Success' } = options || {};

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          {
            properties: {
              code: {
                type: 'number',
                example: 200,
                description: '业务状态码',
              },
              data: {
                type: 'object',
                properties: {
                  list: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                    description: '数据列表',
                  },
                  total: {
                    type: 'number',
                    example: 100,
                    description: '总记录数',
                  },
                  pageNo: {
                    type: 'number',
                    example: 1,
                    description: '当前页码',
                  },
                  pageSize: {
                    type: 'number',
                    example: 10,
                    description: '每页数量',
                  },
                  totalPages: {
                    type: 'number',
                    example: 10,
                    description: '总页数',
                  },
                  hasNext: {
                    type: 'boolean',
                    example: true,
                    description: '是否有下一页',
                  },
                  hasPrev: {
                    type: 'boolean',
                    example: false,
                    description: '是否有上一页',
                  },
                },
              },
              message: {
                type: 'string',
                example: 'success',
                description: '响应消息',
              },
              success: {
                type: 'boolean',
                example: true,
                description: '是否成功',
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * 自定义 Swagger 错误响应装饰器
 */
export const ApiErrorResponse = (options?: {
  status?: number;
  description?: string;
  code?: number;
  message?: string;
}) => {
  const {
    status = 400,
    description = 'Error',
    code = status,
    message = 'Error occurred',
  } = options || {};

  return ApiResponse({
    status,
    description,
    schema: {
      properties: {
        code: {
          type: 'number',
          example: code,
          description: '业务状态码',
        },
        data: {
          type: 'null',
          example: null,
          description: '响应数据',
        },
        message: {
          type: 'string',
          example: message,
          description: '错误消息',
        },
        success: {
          type: 'boolean',
          example: false,
          description: '是否成功',
        },
      },
    },
  });
};

/**
 * 组合装饰器：同时定义成功和常见错误响应
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: {
    description?: string;
    isArray?: boolean;
  },
) => {
  return applyDecorators(
    ApiSuccessResponse(model, options),
    ApiErrorResponse({ status: 400, message: 'Bad Request' }),
    ApiErrorResponse({ status: 401, message: 'Unauthorized' }),
    ApiErrorResponse({ status: 403, message: 'Forbidden' }),
    ApiErrorResponse({ status: 404, message: 'Not Found' }),
    ApiErrorResponse({ status: 500, message: 'Internal Server Error' }),
  );
};
