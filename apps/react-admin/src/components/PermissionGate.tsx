import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'

type PermissionGateProps = {
  permCode?: string | null
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({ permCode, fallback = null, children }: PermissionGateProps) {
  const { allowed } = usePermission(permCode)

  return allowed ? <>{children}</> : <>{fallback}</>
}
