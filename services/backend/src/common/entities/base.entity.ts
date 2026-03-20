import { ApiProperty } from '@nestjs/swagger';

export class BaseEntity {
  @ApiProperty({ description: '数据id' })
  id: number;
  @ApiProperty({ description: '创建时间' })
  createdAt: string;
  @ApiProperty({ description: '更新时间' })
  updatedAt: string;
  @ApiProperty({ description: '删除时间' })
  deletedAt: string | null;
  @ApiProperty({ description: '创建人' })
  createdBy: number | null;
  @ApiProperty({ description: '更新人' })
  updatedBy: number | null;
  @ApiProperty({ description: '删除人' })
  deletedBy: number | null;
}
