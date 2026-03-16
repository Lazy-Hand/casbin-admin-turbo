import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ description: '岗位名称', example: '开发工程师' })
  @IsString()
  @IsNotEmpty({ message: '岗位名称不能为空' })
  postName: string;

  @ApiProperty({ description: '岗位编码', example: 'DEV' })
  @IsString()
  @IsNotEmpty({ message: '岗位编码不能为空' })
  postCode: string;

  @ApiProperty({ description: '排序', example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '排序必须是整数' })
  sort?: number;

  @ApiProperty({
    description: '状态：1-启用，0-禁用',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '状态必须是整数' })
  @IsIn([0, 1], { message: '状态值只能是0或1' })
  status?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
