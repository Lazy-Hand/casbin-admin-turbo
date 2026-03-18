import type { AxiosProgressEvent } from '@casbin-admin/http-client'
import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export interface UploadFileDto {
  businessId?: number
  businessType?: string
}

export interface FileEntity {
  id: number
  filename: string
  originalName: string
  size: number
  mimetype: string
  extension: string
  path: string
  url: string
  fileType?: string
  businessId?: number | null
  businessType?: string | null
  status?: number
  isPublic?: boolean
  sort?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface UploadChunkDto extends UploadFileDto {
  uploadId: string
  chunkIndex: number
  totalChunks: number
}

export interface MergeChunksDto extends UploadFileDto {
  uploadId: string
  totalChunks: number
  filename: string
  mimetype: string
  totalSize: number
}

export interface FileSearchParams {
  pageNo?: number
  pageSize?: number
  fileType?: string
  isPublic?: boolean
}

export async function uploadSingle(
  file: File,
  data?: UploadFileDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  const formData = new FormData()
  formData.append('file', file)
  if (data?.businessId) formData.append('businessId', String(data.businessId))
  if (data?.businessType) formData.append('businessType', data.businessType)

  const response = await request.post<FileEntity>('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })

  return response.data
}

export async function uploadMultiple(
  files: File[],
  data?: UploadFileDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  if (data?.businessId) formData.append('businessId', String(data.businessId))
  if (data?.businessType) formData.append('businessType', data.businessType)

  const response = await request.post<FileEntity[]>('/api/files/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })

  return response.data
}

export async function uploadChunk(
  chunk: Blob,
  data: UploadChunkDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  const formData = new FormData()
  formData.append('file', chunk, `chunk-${data.chunkIndex}`)
  formData.append('uploadId', data.uploadId)
  formData.append('chunkIndex', String(data.chunkIndex))
  formData.append('totalChunks', String(data.totalChunks))
  if (data.businessId) formData.append('businessId', String(data.businessId))
  if (data.businessType) formData.append('businessType', data.businessType)

  const response = await request.post<{ uploadId: string; chunkIndex: number }>('/api/files/upload/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })

  return response.data
}

export async function mergeChunks(data: MergeChunksDto) {
  const response = await request.post<FileEntity>('/api/files/upload/chunk/merge', data)
  return response.data
}

export async function getFileList(params: FileSearchParams) {
  const response = await request.get<PageResponse<FileEntity>>('/api/files/page', params)
  return response.data
}

export async function getFileById(id: number) {
  const response = await request.get<FileEntity>(`/api/files/${id}`)
  return response.data
}

export async function deleteFile(id: number) {
  const response = await request.delete(`/api/files/${id}`)
  return response.data
}
