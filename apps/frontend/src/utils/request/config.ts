import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

export interface RequestConfig extends AxiosRequestConfig {
  /** 是否开启重试机制 */
  enableRetry?: boolean
  /** 重试次数，默认 3 次 */
  retryCount?: number
  /** 重试延迟（毫秒），默认 1000ms */
  retryDelay?: number
  /** 是否跳过拦截器处理（逃生通道），直接返回原始 response */
  skipInterceptors?: boolean
  /** 是否跳过默认错误处理（如不弹出 Message） */
  isSkipErrorHandler?: boolean
  /** 是否开启缓存（预留字段，视业务需求实现） */
  enableCache?: boolean

  /** Token 获取函数 */
  getToken?: () => string | null | undefined
  /** Token 刷新或设值函数 */
  setToken?: (token: string, expireAt?: string) => void
  /** 未授权回调（401） */
  onUnauthorized?: () => void
  /** 通用错误提醒（如 Message.error） */
  onErrorAlert?: (msg: string) => void

  /** 自定义请求拦截回调 (供类似 eventBus 派发等需求使用) */
  onRequestStart?: (config: RequestConfig) => void
  /** 自定义响应拦截回调 */
  onResponseSuccess?: (response: AxiosResponse) => void
  /** 自定义请求错误回调 */
  onRequestError?: (error: AxiosError) => void
  /** 自定义响应错误回调 */
  onResponseError?: (error: AxiosError | unknown) => void
}

export interface ResponseData<T = unknown> {
  code: number
  data: T
  message: string
  msg?: string
}

export interface PageResponse<T = unknown> {
  list: T[]
  total: number
  pageNo: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export const BASE_CONFIG: RequestConfig = {
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  enableRetry: false,
}
