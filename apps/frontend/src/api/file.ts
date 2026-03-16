import http, { type PageResponse } from '@/utils/request'
import type { AxiosProgressEvent } from '@casbin-admin/http-client'

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

// 单文件上传
export const uploadSingle = (
  file: File,
  data?: UploadFileDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) => {
  const formData = new FormData()
  formData.append('file', file)
  if (data?.businessId) formData.append('businessId', String(data.businessId))
  if (data?.businessType) formData.append('businessType', data.businessType)

  return http.post<FileEntity>('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}

// 多文件上传
export const uploadMultiple = (
  files: File[],
  data?: UploadFileDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  if (data?.businessId) formData.append('businessId', String(data.businessId))
  if (data?.businessType) formData.append('businessType', data.businessType)

  return http.post<FileEntity[]>('/api/files/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}

// 分片上传：上传单个分片
export const uploadChunk = (
  chunk: Blob,
  data: UploadChunkDto,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) => {
  const formData = new FormData()
  formData.append('file', chunk)
  formData.append('uploadId', data.uploadId)
  formData.append('chunkIndex', String(data.chunkIndex))
  formData.append('totalChunks', String(data.totalChunks))
  if (data.businessId) formData.append('businessId', String(data.businessId))
  if (data.businessType) formData.append('businessType', data.businessType)

  return http.post<{ uploadId: string; chunkIndex: number }>('/api/files/upload/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}

// 分片上传：合并分片
export const mergeChunks = (data: MergeChunksDto) => {
  return http.post<FileEntity>('/api/files/upload/chunk/merge', data)
}

export interface FileSearchParams {
  pageNo?: number
  pageSize?: number
  fileType?: string
  isPublic?: boolean
}

export const getFileList = (params: FileSearchParams) => {
  return http.get<PageResponse<FileEntity>>('/api/files/page', params)
}
