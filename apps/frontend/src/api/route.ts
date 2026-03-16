import http from '@/utils/request'
import type { TreeNode } from '@/utils/treeBuilder'

/**
 * 后端返回的单个路由权限节点（扁平结构）
 */
export interface RoutePermissionNode {
  id: number
  permName: string // 权限名称
  permCode: string // 权限编码（作为路由 name）
  path: string // 路由路径
  icon: string // 图标
  menuType: string // 菜单类型: menu/page/link/iframe/window/divider/group
  component: string // 组件路径，如 "system/user"
  sort: number // 排序
  cache: number // 是否缓存 (0/1)
  hidden: number // 是否隐藏 (0/1)
  parentId: number | null // 父级 ID
  buttons?: string[] // 当前菜单下可用的按钮权限码
  children?: RoutePermissionNode[] // 可选的子节点（树形结构）
}

/**
 * 获取当前用户的路由权限（返回扁平数组）
 */
export const getRoutePermissions = () => {
  return http.get<RoutePermissionNode[]>('/api/auth/route-permissions')
}

/**
 * 树节点类型（带 children）
 */
export type RoutePermissionTreeNode = TreeNode<RoutePermissionNode>
