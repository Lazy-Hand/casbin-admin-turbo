import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export interface Menu {
  id: number
  parentId: number | null
  permName: string // Menu Name
  permCode: string // Permission Code
  resourceType: ResourceType
  menuType: MenuType // 0: Directory, 1: Menu, 2: Button
  path?: string // Route Path
  component?: string // Component Path
  icon?: string
  sort: number
  status: number // 0: Disabled, 1: Enabled
  children?: Menu[]
  createTime?: string
  createdAt?: string
  cache: number
  hidden: number
  frameUrl: string
}

export type MenuType = 'menu' | 'page' | 'link' | 'iframe' | 'window' | 'divider' | 'group'
export type ResourceType = 'menu' | 'button' | 'api'

export interface MenuParams {
  parentId?: number | null
  permName: string
  permCode: string
  resourceType: ResourceType
  menuType: MenuType
  path?: string
  component?: string
  icon?: string
  sort: number
  status: number
  cache: number
  hidden: number
  frameUrl: string
}

export type MenuCreatePayload = Partial<MenuParams> &
  Pick<MenuParams, 'permName' | 'permCode' | 'resourceType'>

export type MenuUpdatePayload = Partial<MenuParams>

export interface MenuSearchParams {
  permName?: string
  status?: number
}

export interface ButtonPermissionPageParams {
  pageNo?: number
  pageSize?: number
  permName?: string
  permCode?: string
  parentId: number
}

/**
 * Get menu list (tree structure)
 */
export const getMenuList = (params?: MenuSearchParams) => {
  return http.get<Menu[]>('/api/permissions/menus', params)
}

/**
 * Get button permissions by page
 */
export const getButtonPermissionPage = (params: ButtonPermissionPageParams) => {
  return http.get<PageResponse<Menu>>('/api/permissions/buttons/page', params)
}

/**
 * Get menu detail
 */
export const getMenu = (id: number) => {
  return http.get<Menu>(`/api/permissions/${id}`)
}

/**
 * Create menu
 */
export const createMenu = (data: MenuCreatePayload) => {
  return http.post<Menu>('/api/permissions', data)
}

/**
 * Update menu
 */
export const updateMenu = (id: number, data: MenuUpdatePayload) => {
  return http.put<Menu>(`/api/permissions/${id}`, data)
}

/**
 * Delete menu
 */
export const deleteMenu = (id: number) => {
  return http.delete(`/api/permissions/${id}`)
}
