import { createRequest, type RequestConfig } from '@casbin-admin/http-client'
import { useAuthStore } from '@/stores/auth'

const requestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  enableRetry: true,
  retryCount: 2,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().clearSession()
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      const redirect = encodeURIComponent(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      )
      window.location.replace(`/login?redirect=${redirect}`)
    }
  },
  onErrorAlert: (message) => {
    if (typeof window !== 'undefined') {
      console.error(`[Request Error] ${message}`)
    }
  },
} satisfies RequestConfig

export const request = createRequest(requestConfig)
