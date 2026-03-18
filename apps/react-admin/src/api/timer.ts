import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export enum TaskType {
  HTTP = 'HTTP',
  SCRIPT = 'SCRIPT',
}

export interface Timer {
  id: number
  name: string
  description?: string | null
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

export async function getTimerList(params: TimerSearchParams) {
  const response = await request.get<PageResponse<Timer>>('/api/timers/page', params)
  return response.data
}

export async function getAllTimers() {
  const response = await request.get<Timer[]>('/api/timers')
  return response.data
}

export async function getTimer(id: number) {
  const response = await request.get<Timer>(`/api/timers/${id}`)
  return response.data
}

export async function getTimerLogs(id: number, limit = 50) {
  const response = await request.get<TimerExecutionLog[]>(`/api/timers/${id}/logs`, { limit })
  return response.data
}

export async function createTimer(data: TimerParams) {
  const response = await request.post<Timer>('/api/timers', data)
  return response.data
}

export async function updateTimer(id: number, data: Partial<TimerParams>) {
  const response = await request.patch<Timer>(`/api/timers/${id}`, data)
  return response.data
}

export async function deleteTimer(id: number) {
  const response = await request.delete(`/api/timers/${id}`)
  return response.data
}

export async function runTimer(id: number) {
  const response = await request.post<{ message: string }>(`/api/timers/${id}/run`)
  return response.data
}
