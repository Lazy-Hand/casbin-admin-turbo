import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * 分页参数转换管道
 * 将 pageNo 和 pageSize 转换为 Prisma 的 skip 和 take
 * 同时保留原始的 pageNo 和 pageSize 以及其他查询参数
 */
@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 如果值中包含 pageNo 或 pageSize，进行转换
    if (value && (value.pageNo !== undefined || value.pageSize !== undefined)) {
      const pageNo = parseInt(value.pageNo) || 1;
      const pageSize = Math.min(parseInt(value.pageSize) || 10, 100); // 限制最大 100

      // 计算 Prisma 分页参数
      const skip = (pageNo - 1) * pageSize;
      const take = pageSize;

      // 返回包含原始参数、Prisma 参数和其他查询参数的对象
      return {
        ...value,
        skip,
        take,
        pageNo,
        pageSize,
      };
    }

    return value;
  }
}
