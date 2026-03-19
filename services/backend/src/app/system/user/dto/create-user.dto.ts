import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty({ description: '用户名' })
  username: string;

  @IsOptional()
  @ApiProperty({ description: '密码' })
  password: string;

  @IsNotEmpty({ message: '昵称不能为空' })
  @ApiProperty({ description: '昵称' })
  nickname: string;

  @IsOptional()
  @IsEnum([0, 1, 2])
  @ApiProperty({ description: '性别：0-未知，1-男，2-女' })
  gender: number;

  @IsOptional()
  @ApiProperty({ description: '头像' })
  avatar: string;

  @IsOptional()
  @ApiProperty({ description: '邮箱' })
  email: string;

  @IsNotEmpty({ message: '手机号不能为空' })
  @ApiProperty({ description: '手机号' })
  mobile: string;

  @ApiProperty({
    description: '状态： 1-正常， 0-停用',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;

  @IsOptional()
  @IsArray()
  @ApiProperty({ description: '数组角色ID', example: [1, 2] })
  roles: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '部门ID必须是整数' })
  @ApiProperty({ description: '部门ID', example: 1, required: false })
  deptId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '岗位ID必须是整数' })
  @ApiProperty({ description: '岗位ID', example: 1, required: false })
  postId?: number;
}
