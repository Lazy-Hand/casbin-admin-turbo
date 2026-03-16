import { useRouteStore } from '@/stores/route'

export function usePermission() {
  const routeStore = useRouteStore()

  const hasPermission = (permission: string) => {
    return routeStore.hasPermission(permission)
  }

  const hasAnyPermission = (permissions: string[]) => {
    if (!permissions.length) return true
    return permissions.some((permission) => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]) => {
    if (!permissions.length) return true
    return permissions.every((permission) => hasPermission(permission))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
