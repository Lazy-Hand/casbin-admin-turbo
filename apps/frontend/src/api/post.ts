import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export interface Post {
  id: number
  postName: string
  postCode: string
  sort: number
  status: 0 | 1
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface PostSearchParams {
  pageNo?: number
  pageSize?: number
  postName?: string
  postCode?: string
  status?: 0 | 1
}

export interface PostParams {
  postName: string
  postCode: string
  sort?: number
  status?: 0 | 1
  remark?: string
}

export const getPostPage = (params: PostSearchParams) => {
  return http.get<PageResponse<Post>>('/api/posts/page', params)
}

export const getPostList = () => {
  return http.get<Post[]>('/api/posts')
}

export const getPostOptions = () => {
  return http.get<Post[]>('/api/posts/options')
}

export const getPost = (id: number) => {
  return http.get<Post>(`/api/posts/${id}`)
}

export const createPost = (data: PostParams) => {
  return http.post<Post>('/api/posts', data)
}

export const updatePost = (id: number, data: PostParams) => {
  return http.patch<Post>(`/api/posts/${id}`, data)
}

export const deletePost = (id: number) => {
  return http.delete(`/api/posts/${id}`)
}
