import type { RoutePermissionNode } from '@/api/route'

/**
 * 树节点（带 children）
 */
export interface TreeNode<T = RoutePermissionNode> extends RoutePermissionNode {
  children?: TreeNode<T>[]
}

type TreeNodeWithChildren<T> = T & {
  children?: TreeNodeWithChildren<T>[]
}

/**
 * 将扁平数组按 parentId 组装成树形结构
 * @param list 扁平数组
 * @param rootParentId 根节点的 parentId（默认 0 或 null）
 * @returns 树形数组
 */
export function buildTree<T extends { parentId: number | null; id: number }>(
  list: T[],
  rootParentId: number | null = 0,
): TreeNodeWithChildren<T>[] {
  const map = new Map<number | null, TreeNodeWithChildren<T>[]>()
  const roots: TreeNodeWithChildren<T>[] = []

  // 初始化 map，按 parentId 分组
  for (const item of list) {
    const parentId = item.parentId ?? 0
    if (!map.has(parentId)) {
      map.set(parentId, [])
    }
    map.get(parentId)!.push({ ...item, children: [] })
  }

  // 递归构建树
  function buildNode(nodes: TreeNodeWithChildren<T>[]) {
    return nodes.map((node) => {
      const children = map.get(node.id) || []
      if (children.length > 0) {
        node.children = buildNode(children)
      } else {
        delete node.children
      }
      return node
    })
  }

  // 获取根节点
  const rootNodes = map.get(rootParentId) || []
  roots.push(...buildNode(rootNodes))

  return roots
}

/**
 * 查找节点及其所有祖先节点（用于菜单展开状态）
 */
export function findAncestors(
  list: RoutePermissionNode[],
  targetId: number,
  ancestors: number[] = [],
): number[] | null {
  for (const item of list) {
    if (item.id === targetId) {
      return [...ancestors, item.id]
    }
    if (item.children) {
      const result = findAncestors(item.children, targetId, [...ancestors, item.id])
      if (result) return result
    }
  }
  return null
}
