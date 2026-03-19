import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum TaskTypeEnum {
  HTTP = 'HTTP',
  SCRIPT = 'SCRIPT',
}

export class CreateTimerDto {
  @ApiProperty({ description: '定时任务名称', example: '每日数据同步' })
  @IsString()
  @IsNotEmpty({ message: '定时任务名称不能为空' })
  name: string;

  @ApiProperty({
    description: '描述',
    example: '每天凌晨同步数据',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'cron 表达式，6位(秒 分 时 日 月 周) 或 5位(分 时 日 月 周)，如 "0 0 * * * *" 表示每小时整点',
    example: '0 0 * * * *',
  })
  @IsString()
  @IsNotEmpty({ message: 'cron 表达式不能为空' })
  cron: string;

  @ApiProperty({
    description: '任务类型：HTTP-请求接口，SCRIPT-执行脚本',
    enum: TaskTypeEnum,
    default: TaskTypeEnum.HTTP,
  })
  @IsEnum(TaskTypeEnum)
  taskType: TaskTypeEnum = TaskTypeEnum.HTTP;

  @ApiProperty({
    description: 'HTTP URL 或脚本路径',
    example: 'https://api.example.com/sync',
  })
  @IsString()
  @IsNotEmpty({ message: '目标地址不能为空' })
  target: string;

  @ApiProperty({
    description: '额外参数，如 method、headers、body 等',
    example: { method: 'POST' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @ApiProperty({
    description: '状态：1-启用，0-禁用',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsEnum([0, 1])
  status?: number;
}

export class UpdateTimerDto extends PartialType(CreateTimerDto) {}
