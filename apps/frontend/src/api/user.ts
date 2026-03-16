import http, { type PageResponse } from '@/utils/request'

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

export interface UserParams {
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

export interface UserSearchParams {
  pageNo?: number
  pageSize?: number
  username?: string
  mobile?: string
  deptId?: number | null
  postId?: number | null
}

export const getUserList = (params: UserSearchParams) => {
  return http.get<PageResponse<User>>('/api/users/page', params)
}

export const getAllUsers = () => {
  return http.get<User[]>('/api/users')
}

export const getUser = (id: number) => {
  return http.get<User>(`/api/users/${id}`)
}

export const createUser = (data: UserParams) => {
  return http.post<User>('/api/users', data)
}

export const updateUser = (id: number, data: Partial<UserParams>) => {
  return http.patch<User>(`/api/users/${id}`, data)
}

export const deleteUser = (id: number) => {
  return http.delete(`/api/users/${id}`)
}
