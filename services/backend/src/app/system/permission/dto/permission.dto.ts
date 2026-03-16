import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';
import type { MenuTypeValue, ResourceTypeValue } from '@/app/library/drizzle';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称', example: '查看文章' })
  @IsString()
  @IsNotEmpty()
  permName: string;

  @ApiProperty({ description: '权限代码', example: 'article:read' })
  @IsString()
  @IsNotEmpty()
  permCode: string;

  @ApiProperty({
    description: 'HTTP 方法',
    example: 'GET',
    required: false,
  })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({
    description: '资源类型',
    example: 'api',
    enum: ['menu', 'api', 'button'],
  })
  @IsString()
  @IsIn(['menu', 'api', 'button'])
  resourceType: ResourceTypeValue;

  @ApiProperty({
    description: '菜单类型',
    required: false,
    enum: ['menu', 'page', 'link', 'iframe', 'window', 'divider', 'group'],
  })
  @IsString()
  @IsOptional()
  menuType?: MenuTypeValue;

  @ApiProperty({
    description: '路径',
    example: '/api/articles',
    required: false,
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({
    description: '组件路径',
    required: false,
  })
  @IsString()
  @IsOptional()
  component?: string;

  @ApiProperty({
    description: '图标',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: '排序',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  sort?: number;

  @ApiProperty({
    description: '是否缓存 0-否，1-是',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cache?: number;

  @ApiProperty({
    description: '是否隐藏 0-否，1-是',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hidden?: number;

  @ApiProperty({
    description: '内链URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  frameUrl?: string;

  @ApiProperty({
    description: '状态： 1-正常， 0-停用',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  @Type(() => Number)
  status?: number;

  @ApiProperty({
    description: '父级ID',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  parentId?: number;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class QueryMenuDto {
  @ApiProperty({
    description: '菜单名称（模糊搜索）',
    required: false,
  })
  @IsString()
  @IsOptional()
  permName?: string;

  @ApiProperty({
    description: '状态：1-正常，0-停用',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  @Type(() => Number)
  status?: number;
}

export class QueryButtonPermissionPageDto extends PaginationDto {
  @ApiProperty({
    description: '按钮名称（模糊搜索）',
    required: false,
  })
  @IsString()
  @IsOptional()
  permName?: string;

  @ApiProperty({
    description: '按钮编码（模糊搜索）',
    required: false,
  })
  @IsString()
  @IsOptional()
  permCode?: string;

  @ApiProperty({
    description: '父级菜单ID（必传）',
    required: true,
    example: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  parentId: number;
}
