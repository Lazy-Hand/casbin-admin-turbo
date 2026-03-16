import http from '@/utils/request'
export interface LoginData {
  username: string
  password: string
}
export interface LoginResponse {
  token: string
  loginTime: string
  expireAt: string
}

export interface UserInfoResponse {
  userId: string
  username: string
  email: string
  phone: string
  avatar: string
  roles: string[]
  permissions: string[]
}

/**
 * 登录
 * @param data
 * @returns
 */
export const login = (data: LoginData) => {
  return http.post<LoginResponse>('/api/auth/login', data)
}

/**
 * 退出登录
 * @returns
 */
export const logout = () => {
  return http.post('/api/auth/logout')
}

/**
 * 获取用户信息
 * @returns
 */
export const getUserInfo = () => {
  return http.get<UserInfoResponse>('/api/auth/profile')
}
