import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

// ==================== 字典类型 DTO ====================

export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称', example: '性别' })
  @IsString()
  @IsNotEmpty({ message: '字典名称不能为空' })
  dictName: string;

  @ApiProperty({ description: '字典编码', example: 'gender' })
  @IsString()
  @IsNotEmpty({ message: '字典编码不能为空' })
  dictCode: string;

  @ApiProperty({
    description: '描述',
    example: '性别字典',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '状态：1-启用，0-停用',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;
}

export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {}

export class DictTypeQueryDto extends PaginationDto {
  @ApiProperty({ description: '字典名称（模糊搜索）', required: false })
  @IsOptional()
  @IsString()
  dictName?: string;

  @ApiProperty({ description: '字典编码（模糊搜索）', required: false })
  @IsOptional()
  @IsString()
  dictCode?: string;

  @ApiProperty({ description: '状态：1-启用，0-停用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

// ==================== 字典项 DTO ====================

export class CreateDictItemDto {
  @ApiProperty({ description: '所属字典类型ID', example: 1 })
  @IsInt()
  @IsNotEmpty({ message: '字典类型ID不能为空' })
  @Type(() => Number)
  dictTypeId: number;

  @ApiProperty({ description: '显示标签', example: '男' })
  @IsString()
  @IsNotEmpty({ message: '显示标签不能为空' })
  label: string;

  @ApiProperty({ description: '字典值', example: '1' })
  @IsString()
  @IsNotEmpty({ message: '字典值不能为空' })
  value: string;

  @ApiProperty({
    description: '颜色标识',
    example: 'success',
    required: false,
  })
  @IsOptional()
  @IsString()
  colorType?: string;

  @ApiProperty({ description: '排序', example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiProperty({
    description: '状态：1-启用，0-停用',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;
}

export class UpdateDictItemDto extends PartialType(CreateDictItemDto) {}
