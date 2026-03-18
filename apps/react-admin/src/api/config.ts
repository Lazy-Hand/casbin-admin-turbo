import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface Config {
  id: number
  configKey: string
  configValue: string
  description?: string | null
  status: number
  createdAt?: string
  updatedAt?: string
}

export interface ConfigSearchParams {
  pageNo?: number
  pageSize?: number
  configKey?: string
  status?: number
}

export async function getConfigPage(params: ConfigSearchParams) {
  const response = await request.get<PageResponse<Config>>('/api/configs/page', params)
  return response.data
}

export async function getAllConfigs() {
  const response = await request.get<Config[]>('/api/configs')
  return response.data
}

export async function getConfigById(id: number) {
  const response = await request.get<Config>(`/api/configs/${id}`)
  return response.data
}

export async function createConfig(data: Partial<Config>) {
  const response = await request.post<Config>('/api/configs', data)
  return response.data
}

export async function updateConfig(data: Partial<Config> & { id: number }) {
  const response = await request.patch<Config>(`/api/configs/${data.id}`, data)
  return response.data
}

export async function deleteConfig(id: number) {
  const response = await request.delete(`/api/configs/${id}`)
  return response.data
}
