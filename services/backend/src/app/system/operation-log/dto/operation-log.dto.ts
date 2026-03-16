import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import type { LogOperationValue } from '@/app/library/drizzle';

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonPrimitive | JsonInputValue[] | JsonObject };
type JsonInputValue = string | number | boolean | JsonInputValue[] | JsonObject;

export class QueryLoginLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '用户名', required: false })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '开始时间 (ISO 8601)', required: false })
  startTime?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '结束时间 (ISO 8601)', required: false })
  endTime?: string;

  @IsOptional()
  @IsEnum([0, 1])
  @ApiProperty({ description: '状态：1-成功，0-失败', required: false })
  status?: number;
}

export class QueryOperationLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '用户名', required: false })
  username?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '模块名', required: false })
  module?: string;

  @IsOptional()
  @IsEnum(['CREATE', 'UPDATE', 'DELETE'])
  @ApiProperty({ description: '操作类型', enum: ['CREATE', 'UPDATE', 'DELETE'], required: false })
  operation?: LogOperationValue;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '开始时间 (ISO 8601)', required: false })
  startTime?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '结束时间 (ISO 8601)', required: false })
  endTime?: string;

  @IsOptional()
  @IsEnum([0, 1])
  @ApiProperty({ description: '状态：1-成功，0-失败', required: false })
  status?: number;
}

export class CreateOperationLogDto {
  userId?: number;
  username: string;
  module: string;
  operation: LogOperationValue;
  description?: string;
  method: string;
  path: string;
  params?: JsonInputValue;
  ip?: string;
  userAgent?: string;
  status: number;
  result?: string;
  duration?: number;
}
