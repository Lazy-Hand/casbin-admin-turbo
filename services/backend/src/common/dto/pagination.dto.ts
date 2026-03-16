import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

/**
 * 分页查询基础 DTO
 */
export class PaginationDto {
  @ApiProperty({
    description: '页码（从 1 开始）',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  pageNo: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为 1' })
  @Max(100, { message: '每页数量最大为 100' })
  pageSize: number = 10;

  // 偏移分页参数（由管道自动填充，不需要在 Swagger 中显示）
  @IsOptional()
  @Type(() => Number)
  skip: number;

  @IsOptional()
  @Type(() => Number)
  take: number;
}

/**
 * 偏移分页参数
 */
export interface OffsetPaginationParams {
  skip: number;
  take: number;
}

/**
 * 分页响应 DTO
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  pageNo: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;

  @ApiProperty({ description: '是否有下一页', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '是否有上一页', example: false })
  hasPrev: boolean;
}

/**
 * 创建分页响应
 */
export function createPaginationResponse<T>(
  list: T[],
  total: number | string,
  pageNo: number,
  pageSize: number,
): PaginationResponseDto<T> {
  const normalizedTotal = Number(total) || 0;
  const normalizedPageNo = Number(pageNo) || 1;
  const normalizedPageSize = Number(pageSize) || 10;
  const totalPages = Math.ceil(normalizedTotal / normalizedPageSize);

  return {
    list,
    total: normalizedTotal,
    pageNo: normalizedPageNo,
    pageSize: normalizedPageSize,
    totalPages,
    hasNext: normalizedPageNo < totalPages,
    hasPrev: normalizedPageNo > 1,
  };
}
