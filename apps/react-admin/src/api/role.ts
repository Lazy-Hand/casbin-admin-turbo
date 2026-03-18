import { request } from '@/lib/request'

export interface Role {
  id: number
  roleName: string
  roleCode: string
  description?: string
  status: 0 | 1
  createdAt?: string
}

export async function getRoleOptions() {
  const response = await request.get<Role[]>('/api/roles')
  return response.data
}
