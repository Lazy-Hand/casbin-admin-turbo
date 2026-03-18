import type { ItemType } from 'antd/es/menu/interface'
import { Link } from '@tanstack/react-router'
import { DynamicIcon } from '@/components/DynamicIcon'
import { localRoutePaths, localRoutes } from '@/config/routes'
import type { RoutePermissionNode } from '@/types/route'

function normalizePath(path?: string) {
  return path?.startsWith('/') ? path : `/${path || ''}`.replace(/\/+/g, '/')
}

function isExternalMenu(node: RoutePermissionNode) {
  return node.menuType === 'window' || node.menuType === 'link'
}

function renderMenuLabel(node: RoutePermissionNode, path: string) {
  if (isExternalMenu(node)) {
    return (
      <a href={path || '/'} target="_blank" rel="noopener noreferrer">
        {node.permName}
      </a>
    )
  }

  return <Link to={path || '/'}>{node.permName}</Link>
}

function mapNodeToMenuItem(node: RoutePermissionNode): ItemType | null {
  if (node.hidden === 1 || node.menuType === 'button') {
    return null
  }

  const path = normalizePath(node.path)
  const children = (node.children || [])
    .map(mapNodeToMenuItem)
    .filter((item): item is ItemType => item !== null)

  if (node.menuType === 'divider') {
    return {
      type: 'divider',
      key: `divider-${node.id}`,
    }
  }

  if (node.menuType === 'group') {
    if (!children.length) {
      return null
    }

    return {
      type: 'group',
      key: path || node.permCode || `group-${node.id}`,
      label: node.permName,
      children,
    }
  }

  if (!children.length && !localRoutePaths.has(path) && !isExternalMenu(node)) {
    return null
  }

  return {
    key: path || node.permCode,
    icon: node.icon ? <DynamicIcon icon={node.icon} className="size-4" /> : undefined,
    label: children.length ? node.permName : renderMenuLabel(node, path),
    children: children.length ? children : undefined,
  }
}

export function buildAppMenus(menuTree: RoutePermissionNode[]): ItemType[] {
  const fixedMenus: ItemType[] = localRoutes
    .filter((item) => item.menuVisible !== false)
    .map((item) => ({
      key: item.path,
      icon: item.icon,
      label: <Link to={item.path}>{item.title}</Link>,
    }))

  const dynamicMenus = menuTree
    .map(mapNodeToMenuItem)
    .filter((item): item is ItemType => item !== null)

  return [...fixedMenus, ...dynamicMenus]
}
