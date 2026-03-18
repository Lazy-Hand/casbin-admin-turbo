import type { ItemType } from 'antd/es/menu/interface'
import { Link } from '@tanstack/react-router'
import { DynamicIcon } from '@/components/DynamicIcon'
import { localRoutePaths, localRoutes } from '@/config/routes'
import type { RoutePermissionNode } from '@/types/route'

function mapNodeToMenuItem(node: RoutePermissionNode): ItemType | null {
  if (node.hidden === 1 || ['divider', 'button'].includes(node.menuType)) {
    return null
  }

  const path = node.path?.startsWith('/') ? node.path : `/${node.path || ''}`.replace(/\/+/g, '/')
  const children = (node.children || [])
    .map(mapNodeToMenuItem)
    .filter((item): item is ItemType => item !== null)

  if (!children.length && !localRoutePaths.has(path)) {
    return null
  }

  return {
    key: path || node.permCode,
    icon: node.icon ? <DynamicIcon icon={node.icon} className="size-4" /> : undefined,
    label: children.length ? node.permName : <Link to={path || '/'}>{node.permName}</Link>,
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
