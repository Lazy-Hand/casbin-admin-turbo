import { PaginationDto } from '@/common/dto/pagination.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto extends PaginationDto {
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
