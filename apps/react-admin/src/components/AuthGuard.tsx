import { Spin } from 'antd'
import { Navigate, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const search = useRouterState({ select: (state) => state.location.searchStr })
  const token = useAuthStore((state) => state.token)
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped)
  const bootstrapQuery = useAuthBootstrap(Boolean(token) && !isBootstrapped)

  if (!token) {
    const redirect = `${pathname}${search}`
    return <Navigate to="/login" search={{ redirect }} />
  }

  if (!isBootstrapped && bootstrapQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!isBootstrapped && bootstrapQuery.isError) {
    const redirect = `${pathname}${search}`
    return <Navigate to="/login" search={{ redirect }} />
  }

  return <>{children}</>
}
