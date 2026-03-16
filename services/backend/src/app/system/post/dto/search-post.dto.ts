import { PaginationDto } from '@/common/dto/pagination.dto';
import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPostDto extends PaginationDto {
  @IsOptional()
  @ApiProperty({ description: '岗位名称', example: '开发', required: false })
  @IsString()
  postName?: string;

  @IsOptional()
  @ApiProperty({ description: '岗位编码', example: 'DEV', required: false })
  @IsString()
  postCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '状态必须是整数' })
  @ApiProperty({
    description: '状态：1-启用，0-禁用',
    example: 1,
    required: false,
  })
  status?: number;
}
