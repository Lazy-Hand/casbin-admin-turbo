import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface Post {
  id: number
  postName: string
  postCode: string
  sort: number
  status: 0 | 1
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface PostSearchParams {
  pageNo?: number
  pageSize?: number
  postName?: string
  postCode?: string
  status?: 0 | 1
}

export interface PostFormData {
  postName: string
  postCode: string
  sort?: number
  status?: 0 | 1
  remark?: string
}

export async function getPostPage(params: PostSearchParams) {
  const response = await request.get<PageResponse<Post>>('/api/posts/page', params)
  return response.data
}

export async function getPostOptions() {
  const response = await request.get<Post[]>('/api/posts/options')
  return response.data
}

export async function getPost(id: number) {
  const response = await request.get<Post>(`/api/posts/${id}`)
  return response.data
}

export async function createPost(data: PostFormData) {
  const response = await request.post<Post>('/api/posts', data)
  return response.data
}

export async function updatePost(id: number, data: PostFormData) {
  const response = await request.patch<Post>(`/api/posts/${id}`, data)
  return response.data
}

export async function deletePost(id: number) {
  const response = await request.delete(`/api/posts/${id}`)
  return response.data
}
