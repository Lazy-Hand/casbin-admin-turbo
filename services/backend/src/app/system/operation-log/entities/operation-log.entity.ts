import { ApiProperty } from '@nestjs/swagger';
import type { LogOperationValue } from '@/app/library/drizzle';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export class OperationLogEntity {
  @ApiProperty({ description: '日志ID' })
  id: number;

  @ApiProperty({ description: '操作人ID', required: false })
  userId: number | null;

  @ApiProperty({ description: '操作人用户名' })
  username: string;

  @ApiProperty({ description: '模块名' })
  module: string;

  @ApiProperty({ description: '操作类型', enum: ['CREATE', 'UPDATE', 'DELETE'] })
  operation: LogOperationValue;

  @ApiProperty({ description: '操作描述', required: false })
  description: string | null;

  @ApiProperty({ description: 'HTTP方法' })
  method: string;

  @ApiProperty({ description: 'API路径' })
  path: string;

  @ApiProperty({ description: '请求参数', required: false })
  params: JsonValue;

  @ApiProperty({ description: '客户端IP', required: false })
  ip: string | null;

  @ApiProperty({ description: '浏览器/设备信息', required: false })
  userAgent: string | null;

  @ApiProperty({ description: '状态：1-成功，0-失败' })
  status: number;

  @ApiProperty({ description: '结果或错误信息', required: false })
  result: string | null;

  @ApiProperty({ description: '执行耗时(毫秒)', required: false })
  duration: number | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
