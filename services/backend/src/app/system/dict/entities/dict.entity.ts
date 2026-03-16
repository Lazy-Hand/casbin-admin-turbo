import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@/common/entities/base.entity';

export class DictTypeEntity extends BaseEntity {
  @ApiProperty({ description: '字典名称' })
  dictName: string;

  @ApiProperty({ description: '字典编码' })
  dictCode: string;

  @ApiProperty({ description: '描述' })
  description: string;

  @ApiProperty({ description: '状态：1-启用，0-停用' })
  status: number;
}

export class DictItemEntity extends BaseEntity {
  @ApiProperty({ description: '所属字典类型ID' })
  dictTypeId: number;

  @ApiProperty({ description: '显示标签' })
  label: string;

  @ApiProperty({ description: '字典值' })
  value: string;

  @ApiProperty({ description: '颜色标识' })
  colorType: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '状态：1-启用，0-停用' })
  status: number;
}
