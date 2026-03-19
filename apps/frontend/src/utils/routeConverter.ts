import { markRaw } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { RoutePermissionNode } from '@/api/route'
import type { TreeNode } from '@/utils/treeBuilder'
import { buildTree } from './treeBuilder'
import AppLayout from '@/layouts/index.vue'

const RawAppLayout = markRaw(AppLayout)

/**
 * 路由元数据类型
 */
export interface DynamicRouteMeta extends Record<PropertyKey, unknown> {
  title: string
  icon?: string
  type?: string
  cache?: boolean
  hidden?: boolean
}

/**
 * 组件路径映射
 * 后端 component 字段 -> 前端组件路径
 */
const COMPONENT_MAP: Record<string, RouteRecordRaw['component']> = {
  'system/user': () => import('@/views/system/user/index.vue'),
  'system/menu': () => import('@/views/system/menu/index.vue'),
  'system/role': () => import('@/views/system/role/index.vue'),
  'system/dictionary': () => import('@/views/system/dictionary/index.vue'),
}

/**
 * 根据后端 component 字段获取前端组件
 */
function resolveComponent(component?: string) {
  if (!component) return undefined

  // 尝试从映射表获取
  if (COMPONENT_MAP[component]) {
    return COMPONENT_MAP[component]
  }

  // 动态解析: system/user -> @/views/system/user/index.vue
  const parts = component.split('/')
  if (parts.length >= 2) {
    const module = parts[0]
    const page = parts[1]
    return () => import(`@/views/${module}/${page}/index.vue`)
  }

  // 单层路径: dashboard -> @/views/dashboard/index.vue
  return () => import(`@/views/${component}/index.vue`)
}

/**
 * 将树节点转换为 Vue Router 路由记录
 */
function convertNodeToRoute(node: TreeNode, parentPath = ''): RouteRecordRaw {
  // 解析完整路径
  let fullPath = node.path || ''
  if (!fullPath.startsWith('/') && parentPath) {
    fullPath = `${parentPath}/${fullPath}`.replace(/\/+/g, '/')
  }

  const component = resolveComponent(node.component)
  const children = node.children?.map((child) => convertNodeToRoute(child, fullPath))

  // base meta
  const meta: DynamicRouteMeta = {
    title: node.permName,
    icon: node.icon,
    type: node.menuType,
    cache: node.cache === 1,
    hidden: node.hidden === 1,
  }

  // 有子路由但没有 component（如 group），需要 redirect
  if (children && children.length > 0 && !component) {
    return {
      path: node.path || '',
      name: node.permCode,
      redirect: children[0]?.path || fullPath,
      children,
      meta,
    }
  }

  // 正常路由
  const baseRoute = {
    path: node.path || '',
    name: node.permCode,
    component,
    meta,
  } as RouteRecordRaw

  if (children && children.length > 0) {
    baseRoute.children = children
  }

  return baseRoute
}

/**
 * 将扁平的路由权限数组转换为 Vue Router 路由记录数组
 *
 * 规则：
 * 1. menuType=window 的路由作为一级路由（独立窗口）
 * 2. 其他路由放在 Layout 下
 * 3. 按 parentId 组装成树形结构
 */
export function convertToRouteRecords(nodes: RoutePermissionNode[]): RouteRecordRaw[] {
  // 1. 过滤掉 divider 类型，保留没有 path 的 group 节点用于构建树结构
  const menuNodes = nodes.filter(
    (n) => n.menuType !== 'divider' && (!!n.path || n.menuType === 'group'),
  )

  // 2. 先构建完整的树（包含 group），这样 group 下的子节点才能正确组织
  const fullTree = buildTree(menuNodes)

  // 4. 递归提取 window 节点到 windowNodes，并从树中移除（包括嵌套在 group 下的）
  const windowNodes: TreeNode[] = []

  function removeWindowNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = []
    for (const node of nodes) {
      if (node.menuType === 'window') {
        // window 类型提取到 windowNodes，不放入 result
        windowNodes.push(node)
      } else {
        // 非window类型，保留
        result.push(node)
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          node.children = removeWindowNodes(node.children)
          if (node.children.length === 0) {
            delete node.children
          }
        }
      }
    }
    return result
  }

  const layoutNodes = removeWindowNodes(fullTree)

  // 5. 组装路由
  const routes: RouteRecordRaw[] = []

  // 6. 处理 window 类型路由（作为一级路由）
  for (const node of windowNodes) {
    routes.push(convertNodeToRoute(node))
  }

  // 7. 处理 Layout 下的路由
  if (layoutNodes.length > 0) {
    const layoutRoute: RouteRecordRaw = {
      path: '/',
      name: 'Layout',
      component: RawAppLayout,
      redirect: layoutNodes[0]?.path || '/dashboard',
      children: layoutNodes.map((node) => convertNodeToRoute(node)),
    }
    routes.push(layoutRoute)
  }

  return routes
}

/**
 * 构建菜单树（用于菜单渲染）
 */
export function buildMenuTree(nodes: RoutePermissionNode[]): TreeNode[] {
  // 过滤掉隐藏的节点
  const visibleNodes = nodes.filter((n) => n.hidden !== 1)
  const tree = buildTree(visibleNodes)

  // 递归添加 type 字段：当 menuType 为 divider 或 group 时，type = menuType
  function addTypeField(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.menuType === 'divider' || node.menuType === 'group') {
        ;(node as TreeNode & { type?: 'divider' | 'group' }).type = node.menuType
      }
      if (node.children && node.children.length > 0) {
        addTypeField(node.children)
      }
    }
  }

  addTypeField(tree)
  return tree
}
