import { createRequest, type PageResponse, type RequestConfig, type ResponseData } from '@casbin-admin/http-client'
import { localCache } from '@/utils/storage'
import router from '@/router'
export { checkStatus } from '@casbin-admin/http-client'
export type { RequestConfig, ResponseData, PageResponse } from '@casbin-admin/http-client'

let isHandlingUnauthorized = false

function resolveLoginRedirect() {
  if (typeof window === 'undefined') {
    return '/home'
  }

  const currentRoute = router.currentRoute.value
  const routeName = typeof currentRoute.name === 'string' ? currentRoute.name : ''
  const invalidRouteNames = new Set(['login', '401', '404'])

  if (currentRoute.fullPath && !invalidRouteNames.has(routeName)) {
    return currentRoute.fullPath
  }

  const browserFullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (!['/login', '/401', '/404'].includes(window.location.pathname) && browserFullPath) {
    return browserFullPath
  }

  return '/home'
}

let unauthorizedCallback: () => void = () => {
  if (typeof window !== 'undefined') {
    if (isHandlingUnauthorized) {
      return
    }

    isHandlingUnauthorized = true
    localCache.remove('token')
    localCache.remove('userInfo')
    console.warn('[Request] 401 Unauthorized - 请调用 setUnauthorizedCallback 设置跳转逻辑')
    const redirect = resolveLoginRedirect()

    window.$dialog.error({
      title: '登录过期',
      content: '您的登录已过期，请重新登录',
      positiveText: '重新登录',
      onPositiveClick: () => {
        return router.replace({
          path: '/login',
          query: redirect && redirect !== '/home' ? { redirect } : undefined,
        }).finally(() => {
          isHandlingUnauthorized = false
        })
      },
      onClose: () => {
        isHandlingUnauthorized = false
      },
    })
  }
}

export const requestConfig = {
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
} satisfies RequestConfig

export function setUnauthorizedCallback(callback: () => void) {
  unauthorizedCallback = callback
}

const requestHttp = createRequest(requestConfig)

export default requestHttp
