import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface Dept {
  id: number
  name: string
  parentId?: number | null
  leaderId?: number | null
  leader?: {
    id: number
    username: string
    nickname: string
  } | null
  status: number
  sort: number
  remark?: string | null
  createdAt?: string
  updatedAt?: string
  children?: Dept[]
}

export interface DeptQueryParams {
  pageNo?: number
  pageSize?: number
  name?: string
  status?: number
  parentId?: number | null
}

export interface DeptFormData {
  name: string
  parentId?: number | null
  leaderId?: number | null
  status?: number
  sort?: number
  remark?: string
}

export async function getDeptList(params: DeptQueryParams) {
  const response = await request.get<PageResponse<Dept>>('/api/depts', params)
  return response.data
}

export async function getDeptTree() {
  const response = await request.get<Dept[]>('/api/depts/tree')
  return response.data
}

export async function getDeptDetail(id: number) {
  const response = await request.get<Dept>(`/api/depts/${id}`)
  return response.data
}

export async function createDept(data: DeptFormData) {
  const response = await request.post<Dept>('/api/depts', data)
  return response.data
}

export async function updateDept(id: number, data: Partial<DeptFormData>) {
  const response = await request.put<Dept>(`/api/depts/${id}`, data)
  return response.data
}

export async function deleteDept(id: number) {
  const response = await request.delete(`/api/depts/${id}`)
  return response.data
}
