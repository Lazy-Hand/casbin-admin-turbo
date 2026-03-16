import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import type { RoutePermissionNode, RoutePermissionTreeNode } from '@/api/route'
import { getRoutePermissions } from '@/api/route'
import { convertToRouteRecords, buildMenuTree } from '@/utils/routeConverter'

// Store 状态接口
interface RouteStoreState {
  isLoaded: Ref<boolean>
  flatPermissions: Ref<RoutePermissionNode[]>
  buttonPermissions: Ref<string[]>
  menuTree: Ref<RoutePermissionTreeNode[]>
  dynamicRoutes: ShallowRef<RouteRecordRaw[]>
  registeredRouteNames: Ref<string[]>
}

// Store 操作接口
interface RouteStoreActions {
  loadDynamicRoutes: (router: Router) => Promise<{ success: boolean; routes: RouteRecordRaw[] }>
  resetRoutes: (router?: Router) => void
  getMenuData: () => RoutePermissionTreeNode[]
  getPermissionByCode: (permCode: string) => RoutePermissionNode | undefined
  hasButtonPermission: (permCode: string) => boolean
  hasPermission: (permCode: string) => boolean
}

// Store 类型
type RouteStore = RouteStoreState & RouteStoreActions

export const useRouteStore = defineStore('route', (): RouteStore => {
  // 动态路由是否已加载
  const isLoaded = ref(false)
  // 原始扁平数据
  const flatPermissions = ref<RoutePermissionNode[]>([])
  // 按钮权限码集合（从菜单节点 buttons 聚合）
  const buttonPermissions = ref<string[]>([])
  // 菜单树数据
  const menuTree = ref<RoutePermissionTreeNode[]>([])
  // 动态路由列表
  const dynamicRoutes = shallowRef<RouteRecordRaw[]>([])
  // 已注册的动态路由名称
  const registeredRouteNames = ref<string[]>([])

  const hydratePermissions = (data: RoutePermissionNode[]) => {
    flatPermissions.value = data
    buttonPermissions.value = Array.from(
      new Set(
        data.flatMap((item) => item.buttons || []).filter((code) => !!code),
      ),
    )
    menuTree.value = buildMenuTree(data)
    dynamicRoutes.value = convertToRouteRecords(data)
  }

  const registerDynamicRoutes = (router: Router, routes: RouteRecordRaw[]) => {
    const routeNames: string[] = []

    routes.forEach((route) => {
      if (route.name && router.hasRoute(route.name)) {
        router.removeRoute(route.name)
      }

      router.addRoute(route)

      if (route.name) {
        routeNames.push(String(route.name))
      }
    })

    registeredRouteNames.value = routeNames
    isLoaded.value = true
  }

  /**
   * 加载动态路由
   */
  const loadDynamicRoutes = async (router: Router) => {
    try {
      const { data } = await getRoutePermissions()
      hydratePermissions(data)
      registerDynamicRoutes(router, dynamicRoutes.value)

      return { success: true, routes: dynamicRoutes.value }
    } catch (error) {
      console.error('Failed to load dynamic routes:', error)
      isLoaded.value = false
      return { success: false, routes: [] }
    }
  }

  /**
   * 重置路由状态
   */
  const resetRoutes = (router?: Router) => {
    if (router) {
      registeredRouteNames.value.forEach((routeName) => {
        if (router.hasRoute(routeName)) {
          router.removeRoute(routeName)
        }
      })
    }

    isLoaded.value = false
    flatPermissions.value = []
    buttonPermissions.value = []
    menuTree.value = []
    dynamicRoutes.value = []
    registeredRouteNames.value = []
  }

  /**
   * 获取菜单数据（树形结构）
   */
  const getMenuData = () => {
    return menuTree.value
  }

  /**
   * 根据 permCode 查找权限
   */
  const getPermissionByCode = (permCode: string) => {
    return flatPermissions.value.find((p) => p.permCode === permCode)
  }

  /**
   * 检查是否有按钮权限
   */
  const hasButtonPermission = (permCode: string) => {
    return buttonPermissions.value.includes(permCode)
  }

  /**
   * 检查是否有某个权限
   */
  const hasPermission = (permCode: string) => {
    return flatPermissions.value.some((p) => p.permCode === permCode) || hasButtonPermission(permCode)
  }

  return {
    isLoaded,
    flatPermissions,
    buttonPermissions,
    menuTree,
    dynamicRoutes,
    registeredRouteNames,
    loadDynamicRoutes,
    resetRoutes,
    getMenuData,
    getPermissionByCode,
    hasButtonPermission,
    hasPermission,
  }
})
