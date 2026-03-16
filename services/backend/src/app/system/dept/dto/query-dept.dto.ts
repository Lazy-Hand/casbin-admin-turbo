import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 查询部门 DTO
 */
export class QueryDeptDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  pageNo?: number;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  pageSize?: number;

  @ApiProperty({ description: '部门名称（模糊查询）', example: '技术', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '状态', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '状态必须是整数' })
  status?: number;

  @ApiProperty({ description: '父部门ID', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '父部门ID必须是整数' })
  parentId?: number;
}
