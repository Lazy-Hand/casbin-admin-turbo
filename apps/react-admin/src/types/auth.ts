import type { RoutePermissionNode } from '@/types/route'

export type UserProfile = {
  userId: string
  username: string
  email: string
  phone: string
  avatar: string
  roles: string[]
  permissions: string[]
}

export type LoginPayload = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  loginTime: string
  expireAt: string
}

export type AuthBootstrapPayload = {
  user: UserProfile
  flatPermissions: RoutePermissionNode[]
}
