import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 导入固定路由模块
const homepageModules = import.meta.glob('./modules/**/homepage.ts', { eager: true })
const docsModules = import.meta.glob('./modules/**/docs.ts', { eager: true })
const systemModules = import.meta.glob('./modules/**/system.ts', { eager: true })

// 基础静态路由（不受权限控制）
const defaultRouterList: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/result/404/index.vue'),
  },
  {
    path: '/401',
    name: '401',
    component: () => import('@/views/result/401/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/result/404/index.vue'),
  },
  // 不再设置默认的 / 重定向，由路由守卫处理
]

// 固定路由模块转换为路由
export function mapModuleRouterList(modules: Record<string, unknown>): Array<RouteRecordRaw> {
  const routerList: Array<RouteRecordRaw> = []
  Object.keys(modules).forEach((key) => {
    const routeModule = modules[key]
    if (typeof routeModule === 'object' && routeModule !== null && 'default' in routeModule) {
      const route = routeModule.default
      const routes = Array.isArray(route) ? [...route] : [route]
      routerList.push(...routes)
    }
  })
  return routerList
}

export const homepageRouterList: Array<RouteRecordRaw> = mapModuleRouterList(homepageModules)
export const docsRouterList: Array<RouteRecordRaw> = mapModuleRouterList(docsModules)
export const systemRouterList: Array<RouteRecordRaw> = mapModuleRouterList(systemModules)

// 所有静态路由
export const allRoutes = [
  ...defaultRouterList,
  ...homepageRouterList,
  ...docsRouterList,
  ...systemRouterList,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // routes: allRoutes,
  routes: defaultRouterList,
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth',
    }
  },
})

export default router
