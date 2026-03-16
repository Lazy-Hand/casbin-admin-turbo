import http from '@/utils/request'

export interface PermissionTreeNode {
  id: number
  parentId: number | null
  permName: string
  permCode: string
  resourceType: 'menu' | 'button' | 'api'
  menuType?: 'menu' | 'page' | 'link' | 'iframe' | 'window' | 'divider' | 'group' | null
  status: number
  sort: number
  children?: PermissionTreeNode[]
}

export interface PermissionTreeQuery {
  permName?: string
  status?: number
}

/**
 * Get menu and button permissions (tree)
 */
export const getMenuAndButtonPermissions = (params?: PermissionTreeQuery) => {
  return http.get<PermissionTreeNode[]>('/api/permissions/menus-and-buttons', params)
}
