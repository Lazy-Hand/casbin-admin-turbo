import { request } from "@/lib/request"
import type { AuthBootstrapPayload, LoginPayload, LoginResponse, UserProfile } from "@/types/auth"
import type { RoutePermissionNode } from "@/types/route"

export async function login(payload: LoginPayload) {
  const response = await request.post<LoginResponse>("/api/auth/login", payload)
  return response.data
}

export async function logout() {
  await request.post("/api/auth/logout")
}

export async function getProfile() {
  const response = await request.get<UserProfile>("/api/auth/profile")
  return response.data
}

export async function getRoutePermissions() {
  const response = await request.get<RoutePermissionNode[]>("/api/auth/route-permissions")
  return response.data
}

export async function bootstrapAuth(): Promise<AuthBootstrapPayload> {
  const [user, flatPermissions] = await Promise.all([getProfile(), getRoutePermissions()])

  return {
    user,
    flatPermissions,
  }
}
