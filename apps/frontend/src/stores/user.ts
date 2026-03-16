import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, login, logout, type LoginData, type UserInfoResponse } from '@/api/login'
import { localCache } from '@/utils/storage'
import { useRouteStore } from './route'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  const token = ref<string | null>(localCache.get('token'))
  const userInfo = ref<UserInfoResponse | null>(localCache.get('userInfo'))

  /**
   * Login action
   */
  const handleLogin = async (loginForm: LoginData) => {
    try {
      const { data } = await login(loginForm)
      token.value = data.token

      // Save token with backend-provided expiration time
      // expireAt is expected to be a Date object or RFC3339 string
      localCache.set('token', data.token, data.expireAt)
      return handleGetUserInfo()
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  /**
   * Get user info action
   */
  const handleGetUserInfo = async () => {
    try {
      const { data } = await getUserInfo()
      userInfo.value = data
      localCache.set('userInfo', data)
      return true
    } catch (error) {
      console.error('Get user info failed:', error)
      return false
    }
  }

  /**
   * Logout action
   */
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout API failed:', error)
    } finally {
      token.value = null
      localCache.remove('token')
      localCache.remove('userInfo')
      userInfo.value = null

      // Reset route store
      const routeStore = useRouteStore()
      routeStore.resetRoutes(router)

      router.push('/login')
    }
  }

  return {
    token,
    userInfo,
    handleLogin,
    handleLogout,
  }
})
