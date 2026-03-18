import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface Dictionary {
  id: number
  dictName: string
  dictCode: string
  description: string
  status: number
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
  status: number
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

export async function getDictionaryList(params: DictionarySearchParams) {
  const response = await request.get<PageResponse<Dictionary>>('/api/dict-types/page', params)
  return response.data
}

export async function getDictionary(id: number) {
  const response = await request.get<Dictionary>(`/api/dict-types/${id}`)
  return response.data
}

export async function createDictionary(data: Partial<Dictionary>) {
  const response = await request.post<Dictionary>('/api/dict-types', data)
  return response.data
}

export async function updateDictionary(data: Partial<Dictionary> & { id: number }) {
  const response = await request.patch<Dictionary>(`/api/dict-types/${data.id}`, data)
  return response.data
}

export async function deleteDictionary(id: number) {
  const response = await request.delete(`/api/dict-types/${id}`)
  return response.data
}

export async function getDictionaryItemList(dictTypeId: number) {
  const response = await request.get<DictionaryItem[]>(`/api/dict-items/type/${dictTypeId}`)
  return response.data
}

export async function createDictionaryItem(data: Partial<DictionaryItem>) {
  const response = await request.post<DictionaryItem>('/api/dict-items', data)
  return response.data
}

export async function updateDictionaryItem(data: Partial<DictionaryItem> & { id: number }) {
  const response = await request.patch<DictionaryItem>(`/api/dict-items/${data.id}`, data)
  return response.data
}

export async function deleteDictionaryItem(itemId: number) {
  const response = await request.delete(`/api/dict-items/${itemId}`)
  return response.data
}

export async function getDictionaryItemListByCode(dictCode: string) {
  const response = await request.get<DictionaryItem[]>(`/api/dict-items/code/${dictCode}`)
  return response.data
}
