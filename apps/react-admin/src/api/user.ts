import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface User {
  id: number
  username: string
  nickname: string
  email?: string
  mobile?: string
  gender?: number
  status: number
  avatar?: string
  isAdmin?: boolean
  deptId?: number | null
  postId?: number | null
  dept?: {
    id: number
    name: string
  } | null
  post?: {
    id: number
    postName: string
  } | null
  roles?: { id: number; roleName: string; roleCode: string }[]
  createdAt?: string
  updatedAt?: string
}

export interface UserSearchParams {
  pageNo?: number
  pageSize?: number
  username?: string
  mobile?: string
  deptId?: number | null
  postId?: number | null
}

export interface UserFormData {
  username: string
  password?: string
  nickname: string
  gender?: number
  avatar?: string
  email?: string
  mobile?: string
  status?: number
  deptId?: number | null
  postId?: number | null
  roles?: number[]
}

export async function getUserList(params: UserSearchParams) {
  const response = await request.get<PageResponse<User>>('/api/users/page', params)
  return response.data
}

export async function getAllUsers() {
  const response = await request.get<User[]>('/api/users')
  return response.data
}

export async function getUser(id: number) {
  const response = await request.get<User>(`/api/users/${id}`)
  return response.data
}

export async function createUser(data: UserFormData) {
  const response = await request.post<User>('/api/users', data)
  return response.data
}

export async function updateUser(id: number, data: Partial<UserFormData>) {
  const response = await request.patch<User>(`/api/users/${id}`, data)
  return response.data
}

export async function deleteUser(id: number) {
  const response = await request.delete(`/api/users/${id}`)
  return response.data
}
