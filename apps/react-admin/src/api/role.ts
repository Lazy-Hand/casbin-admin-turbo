import { request } from '@/lib/request'
import type { PageResponse } from '@/types/common'

export enum DataScope {
  ALL = 1,
  CUSTOM = 2,
  DEPT = 3,
  DEPT_AND_CHILD = 4,
}

export interface Role {
  id: number
  roleName: string
  roleCode: string
  description?: string | null
  status: 0 | 1
  dataScope?: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD'
  customDepts?: number[]
  createdAt?: string
}

export interface RoleSearchParams {
  pageNo?: number
  pageSize?: number
  roleName?: string
  roleCode?: string
  status?: 0 | 1 | null
}

export interface RoleParams {
  roleName: string
  roleCode: string
  description?: string
  status: 0 | 1
  dataScope?: DataScope
  customDepts?: number[]
  permissions?: number[]
}

export interface RolePermissionRelation {
  roleId: number
  permissionId: number
  permission?: {
    id: number
    permName: string
    permCode: string
  }
}

export async function getRoleList(params: RoleSearchParams) {
  const response = await request.get<PageResponse<Role>>('/api/roles/page', params)
  return response.data
}

export async function getRoleOptions() {
  const response = await request.get<Role[]>('/api/roles')
  return response.data
}

export async function getRole(id: number) {
  const response = await request.get<Role>(`/api/roles/${id}`)
  return response.data
}

export async function createRole(data: RoleParams) {
  const response = await request.post<Role>('/api/roles', data)
  return response.data
}

export async function updateRole(id: number, data: RoleParams) {
  const response = await request.put<Role>(`/api/roles/${id}`, data)
  return response.data
}

export async function deleteRole(id: number) {
  const response = await request.delete(`/api/roles/${id}`)
  return response.data
}

export async function getRolePermissions(roleId: number) {
  const response = await request.get<RolePermissionRelation[]>(`/api/roles/${roleId}/permissions`)
  return response.data
}

export async function assignRolePermissions(roleId: number, permissionIds: number[]) {
  const response = await request.post(`/api/roles/${roleId}/permissions/batch`, { permissionIds })
  return response.data
}
