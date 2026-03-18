import type { RoutePermissionNode } from '@/types/route'

export function buildPermissionTree(items: RoutePermissionNode[]) {
  const nodeMap = new Map<number, RoutePermissionNode>()
  const roots: RoutePermissionNode[] = []

  for (const item of items) {
    nodeMap.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const current = nodeMap.get(item.id)
    if (!current) continue

    if (item.parentId == null) {
      roots.push(current)
      continue
    }

    const parent = nodeMap.get(item.parentId)
    if (parent) {
      parent.children = parent.children ?? []
      parent.children.push(current)
    } else {
      roots.push(current)
    }
  }

  const sortNodes = (nodes: RoutePermissionNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort)
    for (const node of nodes) {
      if (node.children?.length) {
        sortNodes(node.children)
      }
    }
  }

  sortNodes(roots)

  return roots
}
