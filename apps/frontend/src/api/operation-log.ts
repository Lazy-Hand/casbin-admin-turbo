import http, { type PageResponse } from '@/utils/request'

// 操作类型
export type LogOperation = 'CREATE' | 'UPDATE' | 'DELETE'

// 操作日志查询参数
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

// 操作日志
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

// 登录日志
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

/**
 * 分页查询操作日志
 */
export const getOperationLogList = (params: OperationLogSearchParams) => {
  return http.get<PageResponse<OperationLog>>('/api/operation-logs/page', params)
}

/**
 * 查询操作日志详情
 */
export const getOperationLogDetail = (id: number) => {
  return http.get<OperationLog>(`/api/operation-logs/${id}`)
}

/**
 * 分页查询登录日志
 */
export const getLoginLogList = (params: {
  pageNo?: number
  pageSize?: number
  username?: string
  status?: number
  startTime?: string
  endTime?: string
}) => {
  return http.get<PageResponse<LoginLog>>('/api/login-logs/page', params)
}
