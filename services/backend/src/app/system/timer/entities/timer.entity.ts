import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@/common/entities/base.entity';
import type { TaskTypeValue } from '@/app/library/drizzle';

export class TimerEntity extends BaseEntity {
  @ApiProperty({ description: '定时任务名称' })
  name: string;

  @ApiProperty({ description: '描述', required: false })
  description: string | null;

  @ApiProperty({ description: 'cron 表达式' })
  cron: string;

  @ApiProperty({
    description: '任务类型：HTTP | SCRIPT',
    enum: ['HTTP', 'SCRIPT'],
  })
  taskType: TaskTypeValue;

  @ApiProperty({ description: '目标 URL 或脚本路径' })
  target: string;

  @ApiProperty({ description: '额外参数', required: false })
  params: object | null;

  @ApiProperty({ description: '状态：1-启用，0-禁用' })
  status: number;

  @ApiProperty({ description: '上次执行时间', required: false })
  lastRunAt: string | null;

  @ApiProperty({ description: '下次预计执行时间', required: false })
  nextRunAt: string | null;
}
