import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export type MenuType = 'menu' | 'page' | 'link' | 'iframe' | 'window' | 'divider' | 'group'
export type ResourceType = 'menu' | 'button' | 'api'

export interface Menu {
  id: number
  parentId: number | null
  permName: string
  permCode: string
  resourceType: ResourceType
  menuType: MenuType
  path?: string
  component?: string
  icon?: string
  sort: number
  status: number
  children?: Menu[]
  createTime?: string
  createdAt?: string
  cache: number
  hidden: number
  frameUrl: string
}

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

export async function getMenuList(params?: MenuSearchParams) {
  const response = await request.get<Menu[]>('/api/permissions/menus', params)
  return response.data
}

export async function getButtonPermissionPage(params: ButtonPermissionPageParams) {
  const response = await request.get<PageResponse<Menu>>('/api/permissions/buttons/page', params)
  return response.data
}

export async function getMenu(id: number) {
  const response = await request.get<Menu>(`/api/permissions/${id}`)
  return response.data
}

export async function createMenu(data: MenuCreatePayload) {
  const response = await request.post<Menu>('/api/permissions', data)
  return response.data
}

export async function updateMenu(id: number, data: MenuUpdatePayload) {
  const response = await request.put<Menu>(`/api/permissions/${id}`, data)
  return response.data
}

export async function deleteMenu(id: number) {
  const response = await request.delete(`/api/permissions/${id}`)
  return response.data
}
