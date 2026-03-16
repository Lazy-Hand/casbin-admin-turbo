import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export enum TaskType {
  HTTP = 'HTTP',
  SCRIPT = 'SCRIPT',
}

export interface Timer {
  id: number
  name: string
  description?: string
  cron: string
  taskType: TaskType
  target: string
  params?: Record<string, unknown>
  status: number
  lastRunAt?: string
  nextRunAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface TimerParams {
  name: string
  description?: string
  cron: string
  taskType: TaskType
  target: string
  params?: Record<string, unknown>
  status?: number | string
}

export interface TimerSearchParams {
  pageNo?: number
  pageSize?: number
  name?: string
  taskType?: TaskType
  status?: number
}

export interface TimerExecutionLog {
  id: number
  timerId: number
  status: number
  startAt: string
  endAt: string
  duration: number
  result?: string
}

/**
 * Get timer list (paginated)
 */
export const getTimerList = (params: TimerSearchParams) => {
  return http.get<PageResponse<Timer>>('/api/timers/page', params)
}

/**
 * Get all timers (non-paginated)
 */
export const getAllTimers = () => {
  return http.get<Timer[]>('/api/timers')
}

/**
 * Get timer detail
 */
export const getTimer = (id: number) => {
  return http.get<Timer>(`/api/timers/${id}`)
}

/**
 * Get timer execution logs
 */
export const getTimerLogs = (id: number, limit = 50) => {
  return http.get<TimerExecutionLog[]>(`/api/timers/${id}/logs`, { limit })
}

/**
 * Create timer
 */
export const createTimer = (data: TimerParams) => {
  return http.post<Timer>('/api/timers', data)
}

/**
 * Update timer
 */
export const updateTimer = (id: number, data: Partial<TimerParams>) => {
  return http.patch<Timer>(`/api/timers/${id}`, data)
}

/**
 * Delete timer
 */
export const deleteTimer = (id: number) => {
  return http.delete(`/api/timers/${id}`)
}

/**
 * Run timer manually
 */
export const runTimer = (id: number) => {
  return http.post<{ message: string }>(`/api/timers/${id}/run`)
}
