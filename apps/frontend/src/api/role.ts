import http from '@/utils/request'
import type { PageResponse } from '@/utils/request'

/**
 * 数据范围枚举
 */
export enum DataScope {
  ALL = 1, // 全部数据
  CUSTOM = 2, // 自定义部门
  DEPT = 3, // 本部门
  DEPT_AND_CHILD = 4, // 本部门及以下
}

export interface Role {
  id: number
  roleName: string
  roleCode: string
  description: string
  status: 0 | 1 // 0: Disabled, 1: Enabled
  dataScope?: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD'
  customDepts?: number[]
  createdAt: string
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

/**
 * Get role list
 */
export const getRoleList = (params: RoleSearchParams) => {
  return http.get<PageResponse<Role>>('/api/roles/page', params)
}

export const getRoleOptions = () => {
  return http.get<Role[]>('/api/roles')
}

/**
 * Get role detail
 */
export const getRole = (id: number) => {
  return http.get<Role>(`/api/roles/${id}`)
}

/**
 * Create role
 */
export const createRole = (data: RoleParams) => {
  return http.post<Role>('/api/roles', data)
}

/**
 * Update role
 */
export const updateRole = (id: number, data: RoleParams) => {
  return http.put<Role>(`/api/roles/${id}`, data)
}

/**
 * Delete role
 */
export const deleteRole = (id: number) => {
  return http.delete(`/api/roles/${id}`)
}

/**
 * Get role permissions
 */
export const getRolePermissions = (roleId: number) => {
  return http.get<RolePermissionRelation[]>(`/api/roles/${roleId}/permissions`)
}

/**
 * Assign role permissions in batch
 */
export const assignRolePermissions = (roleId: number, permissionIds: number[]) => {
  return http.post(`/api/roles/${roleId}/permissions/batch`, { permissionIds })
}
