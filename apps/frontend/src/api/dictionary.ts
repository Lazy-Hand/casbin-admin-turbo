import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export interface Dictionary {
  id: number
  dictName: string
  dictCode: string
  description: string
  status: number // 1: Enabled, 0: Disabled
  createdAt: string
  updatedAt: string
  items?: DictionaryItem[]
}

export interface DictionaryItem {
  id: number
  dictTypeId: number
  label: string
  value: string
  colorType: string
  sort: number
  status: number // 1: Enabled, 0: Disabled
  createdAt: string
  updatedAt: string
}

export interface DictionarySearchParams {
  pageNo?: number
  pageSize?: number
  dictName?: string
  dictCode?: string
  status?: number
}

// Dictionary Type APIs

export const getDictionaryList = (params: DictionarySearchParams) => {
  return http.get<PageResponse<Dictionary>>('/api/dict-types/page', params)
}

export const getDictionary = (id: number) => {
  return http.get<Dictionary>(`/api/dict-types/${id}`)
}

export const createDictionary = (data: Partial<Dictionary>) => {
  return http.post<Dictionary>('/api/dict-types', data)
}

export const updateDictionary = (data: Partial<Dictionary>) => {
  return http.patch<Dictionary>(`/api/dict-types/${data.id}`, data)
}

export const deleteDictionary = (id: number) => {
  return http.delete(`/api/dict-types/${id}`)
}

// Dictionary Item APIs

export const getDictionaryItemList = (dictTypeId: number) => {
  return http.get<DictionaryItem[]>(`/api/dict-items/type/${dictTypeId}`)
}

export const createDictionaryItem = (data: Partial<DictionaryItem>) => {
  return http.post<DictionaryItem>('/api/dict-items', data)
}

export const updateDictionaryItem = (data: Partial<DictionaryItem>) => {
  return http.patch<DictionaryItem>(`/api/dict-items/${data.id}`, data)
}

export const deleteDictionaryItem = (itemId: number) => {
  return http.delete(`/api/dict-items/${itemId}`)
}

// 根据字典编码获取字典项
export const getDictionaryItemListByCode = (dictCode: string) => {
  return http.get<DictionaryItem[]>(`/api/dict-items/code/${dictCode}`)
}
