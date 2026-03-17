import { ApiProperty } from '@nestjs/swagger';

export class TimerExecutionLogEntity {
  @ApiProperty({ description: '日志ID' })
  id: number;

  @ApiProperty({ description: '定时任务ID' })
  timerId: number;

  @ApiProperty({ description: '状态：1-成功，0-失败' })
  status: number;

  @ApiProperty({ description: '开始时间' })
  startAt: string;

  @ApiProperty({ description: '结束时间', required: false })
  endAt: string | null;

  @ApiProperty({ description: '执行耗时(毫秒)', required: false })
  duration: number | null;

  @ApiProperty({ description: '执行结果或错误信息', required: false })
  result: string | null;
}
