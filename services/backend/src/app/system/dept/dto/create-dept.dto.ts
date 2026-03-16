import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsInt, IsString, MaxLength } from 'class-validator';

/**
 * 创建部门 DTO
 */
export class CreateDeptDto {
  @ApiProperty({ description: '部门名称', example: '技术部' })
  @IsNotEmpty({ message: '部门名称不能为空' })
  @IsString()
  @MaxLength(50, { message: '部门名称不能超过50个字符' })
  name: string;

  @ApiProperty({ description: '父部门ID', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: '父部门ID必须是整数' })
  parentId?: number | null;

  @ApiProperty({ description: '负责人ID', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: '负责人ID必须是整数' })
  leaderId?: number | null;

  @ApiProperty({ description: '状态', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  status?: number;

  @ApiProperty({ description: '排序', example: 0, required: false })
  @IsOptional()
  @IsInt({ message: '排序必须是整数' })
  sort?: number;

  @ApiProperty({ description: '备注', example: '负责技术研发', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注不能超过500个字符' })
  remark?: string;
}
