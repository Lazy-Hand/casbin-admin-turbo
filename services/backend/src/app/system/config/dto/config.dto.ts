import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class CreateConfigDto {
  @ApiProperty({ description: '配置键', example: 'site_name' })
  @IsString()
  @IsNotEmpty({ message: '配置键不能为空' })
  @MaxLength(100, { message: '配置键最多100个字符' })
  configKey: string;

  @ApiProperty({ description: '配置值', example: 'Casbin Admin' })
  @IsString()
  @IsNotEmpty({ message: '配置值不能为空' })
  @MaxLength(500, { message: '配置值最多500个字符' })
  configValue: string;

  @ApiProperty({
    description: '描述',
    example: '站点名称',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '描述最多500个字符' })
  description?: string;

  @ApiProperty({
    description: '状态：1-启用，0-禁用',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;
}

export class UpdateConfigDto extends PartialType(CreateConfigDto) {}

export class ConfigQueryDto extends PaginationDto {
  @ApiProperty({ description: '配置键（模糊搜索）', required: false })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiProperty({ description: '状态：1-启用，0-禁用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
