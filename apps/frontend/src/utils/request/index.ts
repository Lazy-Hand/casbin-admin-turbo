import { createRequest } from './request'
import type { RequestConfig } from './config'
import { localCache } from '@/utils/storage'
import router from '@/router'
export { checkStatus } from './checkStatus'
export type { RequestConfig, ResponseData, PageResponse } from './config'

let unauthorizedCallback: () => void = () => {
  if (typeof window !== 'undefined') {
    localCache.remove('token')
    console.warn('[Request] 401 Unauthorized - 请调用 setUnauthorizedCallback 设置跳转逻辑')
    window.$dialog.error({
      title: '登录过期',
      content: '您的登录已过期，请重新登录',
      positiveText: '重新登录',
      onPositiveClick: () => {
        router.push({
          path: '/login',
          query: {
            redirect: router.currentRoute.value.path,
          },
          replace: true,
        })
      },
    })
  }
}

export const requestConfig: RequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localCache.get('token')
    }
    return null
  },
  setToken: (token: string, expireAt?: string) => {
    if (typeof window !== 'undefined') {
      localCache.set('token', token, expireAt)
    }
  },
  onUnauthorized: () => {
    unauthorizedCallback()
  },
  onErrorAlert: (msg: string) => {
    if (typeof window !== 'undefined') {
      window.$message?.error(msg)
    }
  },
}

export function setUnauthorizedCallback(callback: () => void) {
  unauthorizedCallback = callback
}

const requestHttp = createRequest(requestConfig)

export default requestHttp
