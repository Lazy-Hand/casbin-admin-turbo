import { computed, h } from 'vue'
import { RouterLink } from 'vue-router'
import { type MenuOption } from 'naive-ui'
import { useRouteStore } from '@/stores/route'
import type { RoutePermissionTreeNode } from '@/api/route'
import IconRender from '@/components/Icon/IconRender.vue'

export function renderIcon(iconValue: string) {
  if (!iconValue) return undefined
  return () => h(IconRender, { iconValue })
}

export function useMenu() {
  const routeStore = useRouteStore()

  const resolveFullPath = (path = '', parentPath = '') => {
    if (!path) return parentPath || '/'
    if (path.startsWith('/')) return path
    return `${parentPath}/${path}`.replace(/\/+/g, '/')
  }

  /**
   * 将菜单树节点转换为 NaiveUI Menu 选项
   */
  const resolveMenuOptions = (nodes: RoutePermissionTreeNode[], parentPath = ''): MenuOption[] => {
    const options: MenuOption[] = []

    for (const node of nodes) {
      const icon = node.icon ? renderIcon(node.icon) : undefined
      const label = node.permName
      const fullPath = resolveFullPath(node.path, parentPath)

      const currentOption: MenuOption = {
        label: () => {
          // 如果有子节点，直接返回标签
          if (node.children && node.children.length > 0) {
            return label
          }
          // menuType === 'window' 或 'link' 时使用新窗口打开
          if (node.menuType === 'window' || node.menuType === 'link') {
            return h(
              'a',
              { href: fullPath, target: '_blank', class: 'menu-link' },
              { default: () => label },
            )
          }
          // 否则渲染为路由链接
          return h(RouterLink, { to: fullPath }, { default: () => label })
        },
        key: node.permCode, // 使用 permCode 作为 key，path 可能不存在
        icon,
      }

      // 处理 divider 和 group 类型
      if (node.menuType === 'divider' || node.menuType === 'group') {
        ;(currentOption as MenuOption & { type?: 'divider' | 'group' }).type = node.menuType
      }

      // 处理子菜单
      if (node.children && node.children.length > 0) {
        currentOption.children = resolveMenuOptions(node.children, fullPath)
      }

      options.push(currentOption)
    }

    return options
  }

  /**
   * 菜单选项 - 从路由 store 的菜单树生成
   */
  const menuOptions = computed(() => {
    if (routeStore.isLoaded && routeStore.menuTree.length > 0) {
      return resolveMenuOptions(routeStore.menuTree)
    }
    return []
  })

  return {
    menuOptions,
  }
}
