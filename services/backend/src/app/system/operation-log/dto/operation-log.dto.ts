import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LogOperation, Prisma } from '@prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';

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
  @IsEnum(LogOperation)
  @ApiProperty({ description: '操作类型', enum: LogOperation, required: false })
  operation?: LogOperation;

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
  operation: LogOperation;
  description?: string;
  method: string;
  path: string;
  params?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
  status: number;
  result?: string;
  duration?: number;
}
