import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '内容编辑' })
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  roleName: string;

  @ApiProperty({ description: '角色代码', example: 'editor' })
  @IsString()
  @IsNotEmpty({ message: '角色代码不能为空' })
  roleCode: string;

  @ApiProperty({
    description: '角色描述',
    example: '负责内容编辑工作',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '状态： 1-正常， 0-停用',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;

  @ApiProperty({
    description: '权限ID数组',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  permissions?: number[];

  @ApiProperty({
    description: '数据范围: 1-全部数据, 2-自定义部门, 3-本部门, 4-本部门及以下',
    example: 3,
    required: false,
    enum: [1, 2, 3, 4],
  })
  @IsOptional()
  @IsInt({ message: '数据范围必须是整数' })
  @Type(() => Number)
  dataScope?: 1 | 2 | 3 | 4;

  @ApiProperty({
    description: '自定义部门ID列表（当dataScope=2时必填）',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: '部门ID必须是整数' })
  @Type(() => Number)
  customDepts?: number[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AssignPermissionsDto {
  @ApiProperty({ description: '权限 ID 数组', example: [1, 2, 3] })
  @IsArray()
  @IsNotEmpty()
  permissionIds: number[];
}

export class AssignRolesToUserDto {
  @ApiProperty({ description: '角色 ID 数组', example: [1, 2] })
  @IsArray()
  @IsNotEmpty()
  roleIds: number[];
}
