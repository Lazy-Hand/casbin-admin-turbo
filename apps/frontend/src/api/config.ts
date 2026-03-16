import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export interface Config {
  id: number
  configKey: string
  configValue: string
  description: string
  status: number // 1: Enabled, 0: Disabled
  createdAt: string
  updatedAt: string
}

export interface ConfigSearchParams {
  pageNo?: number
  pageSize?: number
  configKey?: string
  status?: number
}

// 分页查询配置列表
export const getConfigPage = (params: ConfigSearchParams) => {
  return http.get<PageResponse<Config>>('/api/configs/page', params)
}

// 获取所有启用的配置
export const getAllConfigs = () => {
  return http.get<Config[]>('/api/configs')
}

// 根据 ID 获取配置详情
export const getConfigById = (id: number) => {
  return http.get<Config>(`/api/configs/${id}`)
}

// 根据 key 获取配置值
export const getConfigByKey = (key: string) => {
  return http.get<string>(`/api/configs/key/${key}`)
}

// 批量获取配置值
export const getConfigsByKeys = (keys: string[]) => {
  return http.get<Record<string, string>>('/api/configs/keys/batch', {
    keys: keys.join(','),
  })
}

// 创建配置
export const createConfig = (data: Partial<Config>) => {
  return http.post<Config>('/api/configs', data)
}

// 更新配置
export const updateConfig = (data: Partial<Config>) => {
  return http.patch<Config>(`/api/configs/${data.id}`, data)
}

// 删除配置
export const deleteConfig = (id: number) => {
  return http.delete(`/api/configs/${id}`)
}
