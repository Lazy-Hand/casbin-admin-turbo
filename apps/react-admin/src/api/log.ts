import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export type LogOperation = 'CREATE' | 'UPDATE' | 'DELETE'

export interface OperationLogSearchParams {
  pageNo?: number
  pageSize?: number
  username?: string
  module?: string
  operation?: LogOperation
  startTime?: string
  endTime?: string
  status?: number
}

export interface OperationLog {
  id: number
  userId: number | null
  username: string
  module: string
  operation: LogOperation
  description: string | null
  method: string
  path: string
  params: unknown
  ip: string | null
  userAgent: string | null
  status: number
  result: string | null
  duration: number | null
  createdAt: string
}

export interface LoginLog {
  id: number
  userId: number | null
  username: string
  ip: string | null
  userAgent: string | null
  status: number
  message: string | null
  createdAt: string
}

export async function getOperationLogList(params: OperationLogSearchParams) {
  const response = await request.get<PageResponse<OperationLog>>('/api/operation-logs/page', params)
  return response.data
}

export async function getOperationLogDetail(id: number) {
  const response = await request.get<OperationLog>(`/api/operation-logs/${id}`)
  return response.data
}

export async function getLoginLogList(params: {
  pageNo?: number
  pageSize?: number
  username?: string
  status?: number
  startTime?: string
  endTime?: string
}) {
  const response = await request.get<PageResponse<LoginLog>>('/api/login-logs/page', params)
  return response.data
}
