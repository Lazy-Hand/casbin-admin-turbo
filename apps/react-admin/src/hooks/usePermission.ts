import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'

export function usePermission(permCode?: string | null) {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const buttonPermissions = useAuthStore((state) => state.buttonPermissions)

  const allowed = useMemo(() => {
    if (!permCode) return true
    return hasPermission(permCode)
  }, [hasPermission, permCode])

  return {
    allowed,
    buttonPermissions,
    hasPermission,
  }
}
