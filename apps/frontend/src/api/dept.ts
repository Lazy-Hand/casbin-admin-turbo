import http from '@/utils/request'

/**
 * 部门数据范围枚举
 */
export enum DataScope {
  ALL = 1, // 全部数据
  CUSTOM = 2, // 自定义部门
  DEPT = 3, // 本部门
  DEPT_AND_CHILD = 4, // 本部门及以下
}

/**
 * 部门实体
 */
export interface Dept {
  id: number
  name: string
  parentId?: number | null
  ancestors?: string | null
  leaderId?: number | null
  leader?: {
    id: number
    username: string
    nickname: string
  } | null
  parent?: {
    id: number
    name: string
  } | null
  status: number
  sort: number
  remark?: string | null
  createdAt?: string
  updatedAt?: string
  children?: Dept[]
}

/**
 * 部门查询参数
 */
export interface DeptQueryParams {
  pageNo?: number
  pageSize?: number
  name?: string
  status?: number
  parentId?: number | null
}

/**
 * 部门表单数据
 */
export interface DeptFormData {
  name: string
  parentId?: number | null
  leaderId?: number | null
  status?: number
  sort?: number
  remark?: string
}

/**
 * 部门列表响应
 */
export interface DeptListResponse {
  list: Dept[]
  total: number
  pageNo: number
  pageSize: number
}

/**
 * 获取部门列表（分页）
 */
export const getDeptList = (params: DeptQueryParams) => {
  return http.get<DeptListResponse>('/api/depts', params)
}

/**
 * 获取部门树
 */
export const getDeptTree = () => {
  return http.get<Dept[]>('/api/depts/tree')
}

/**
 * 获取部门详情
 */
export const getDeptDetail = (id: number) => {
  return http.get<Dept>(`/api/depts/${id}`)
}

/**
 * 创建部门
 */
export const createDept = (data: DeptFormData) => {
  return http.post<Dept>('/api/depts', data)
}

/**
 * 更新部门
 */
export const updateDept = (id: number, data: Partial<DeptFormData>) => {
  return http.put<Dept>(`/api/depts/${id}`, data)
}

/**
 * 删除部门
 */
export const deleteDept = (id: number) => {
  return http.delete(`/api/depts/${id}`)
}
