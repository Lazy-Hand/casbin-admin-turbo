import { ApiProperty } from '@nestjs/swagger';

export class PostEntity {
  @ApiProperty({ description: '岗位ID' })
  id: number;

  @ApiProperty({ description: '岗位名称' })
  postName: string;

  @ApiProperty({ description: '岗位编码' })
  postCode: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '状态：1-启用，0-禁用' })
  status: number;

  @ApiProperty({ description: '备注', required: false })
  remark?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  updatedAt: string;
}
