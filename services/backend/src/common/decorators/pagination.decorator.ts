import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OffsetPaginationParams } from '../dto/pagination.dto';

/**
 * 分页参数装饰器
 * 自动从查询参数中提取并转换分页参数
 *
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@Pagination() pagination: OffsetPaginationParams) {
 *   return this.userService.findPage({
 *     skip: pagination.skip,
 *     take: pagination.take,
 *   });
 * }
 * ```
 */
export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OffsetPaginationParams => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const pageNo = parseInt(query.pageNo) || 1;
    const pageSize = parseInt(query.pageSize) || 10;

    // 限制 pageSize 最大值
    const limitedPageSize = Math.min(pageSize, 100);

    return {
      skip: (pageNo - 1) * limitedPageSize,
      take: limitedPageSize,
    };
  },
);

/**
 * 原始分页参数装饰器
 * 返回原始的 pageNo 和 pageSize
 *
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@RawPagination() pagination: { pageNo: number; pageSize: number }) {
 *   const { pageNo, pageSize } = pagination;
 *   // ...
 * }
 * ```
 */
export const RawPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { pageNo: number; pageSize: number } => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const pageNo = parseInt(query.pageNo) || 1;
    const pageSize = Math.min(parseInt(query.pageSize) || 10, 100);

    return {
      pageNo,
      pageSize,
    };
  },
);
