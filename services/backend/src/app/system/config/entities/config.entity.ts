import { ApiProperty } from '@nestjs/swagger';
import { SysConfig } from '@prisma/client';
import { BaseEntity } from '@/common/entities/base.entity';

export class ConfigEntity extends BaseEntity implements SysConfig {
  @ApiProperty({ description: '配置键' })
  configKey: string;

  @ApiProperty({ description: '配置值' })
  configValue: string;

  @ApiProperty({ description: '描述' })
  description: string;

  @ApiProperty({ description: '状态：1-启用，0-禁用' })
  status: number;
}
