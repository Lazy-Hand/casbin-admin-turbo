import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildPermissionTree } from '@/lib/tree'
import type { AuthBootstrapPayload, LoginResponse, UserProfile } from '@/types/auth'
import type { RoutePermissionNode } from '@/types/route'

type AuthState = {
  token: string | null
  expireAt: string | null
  user: UserProfile | null
  flatPermissions: RoutePermissionNode[]
  buttonPermissions: string[]
  menuTree: RoutePermissionNode[]
  isBootstrapped: boolean
  setLoginResult: (payload: LoginResponse) => void
  setBootstrapData: (payload: AuthBootstrapPayload) => void
  hasPermission: (permCode: string) => boolean
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expireAt: null,
      user: null,
      flatPermissions: [],
      buttonPermissions: [],
      menuTree: [],
      isBootstrapped: false,
      setLoginResult: ({ token, expireAt }) =>
        set({
          token,
          expireAt,
        }),
      setBootstrapData: ({ user, flatPermissions }) =>
        set({
          user,
          flatPermissions,
          buttonPermissions: Array.from(
            new Set(flatPermissions.flatMap((item) => item.buttons || []).filter(Boolean)),
          ),
          menuTree: buildPermissionTree(flatPermissions),
          isBootstrapped: true,
        }),
      hasPermission: (permCode) =>
        get().flatPermissions.some((item) => item.permCode === permCode) ||
        get().buttonPermissions.includes(permCode),
      clearSession: () =>
        set({
          token: null,
          expireAt: null,
          user: null,
          flatPermissions: [],
          buttonPermissions: [],
          menuTree: [],
          isBootstrapped: false,
        }),
    }),
    {
      name: 'react-admin-auth',
      partialize: (state) => ({
        token: state.token,
        expireAt: state.expireAt,
        user: state.user,
        flatPermissions: state.flatPermissions,
        buttonPermissions: state.buttonPermissions,
        menuTree: state.menuTree,
        isBootstrapped: state.isBootstrapped,
      }),
    },
  ),
)
