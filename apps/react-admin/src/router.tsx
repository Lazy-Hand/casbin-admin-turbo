import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { localRoutes } from '@/config/routes'
import { AppShell } from '@/layout/AppShell'
import { DashboardPage } from '@/pages/dashboard'
import { MonitorPage } from '@/pages/dashboard/monitor'
import { WorkbenchPage } from '@/pages/dashboard/workbench'
import { LoginPage } from '@/pages/login'
import { PlaygroundPage } from '@/pages/playground'
import { ConfigPage } from '@/pages/system/config'
import { DeptPage } from '@/pages/system/dept'
import { DictionaryPage } from '@/pages/system/dictionary'
import { FilePage } from '@/pages/system/file'
import { LogPage } from '@/pages/system/log'
import { MenuPage } from '@/pages/system/menu'
import { PostPage } from '@/pages/system/post'
import { RolePage } from '@/pages/system/role'
import { TimerPage } from '@/pages/system/timer'
import { UserPage } from '@/pages/system/user'
import { useAuthStore } from '@/stores/auth'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: `${location.pathname}${location.searchStr}`,
        },
      })
    }
  },
  component: AppShell,
})

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[0]!.path,
  component: DashboardPage,
})

const playgroundRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[1]!.path,
  component: PlaygroundPage,
})

const userRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[4]!.path,
  component: UserPage,
})

const roleRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[5]!.path,
  component: RolePage,
})

const menuRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[6]!.path,
  component: MenuPage,
})

const deptRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[7]!.path,
  component: DeptPage,
})

const postRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[8]!.path,
  component: PostPage,
})

const configRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[9]!.path,
  component: ConfigPage,
})

const dictionaryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[10]!.path,
  component: DictionaryPage,
})

const logRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[11]!.path,
  component: LogPage,
})

const timerRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[12]!.path,
  component: TimerPage,
})

const fileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[13]!.path,
  component: FilePage,
})

const workbenchRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[2]!.path,
  component: WorkbenchPage,
})

const monitorRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: localRoutes[3]!.path,
  component: MonitorPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    playgroundRoute,
    workbenchRoute,
    monitorRoute,
    userRoute,
    roleRoute,
    menuRoute,
    deptRoute,
    postRoute,
    configRoute,
    dictionaryRoute,
    logRoute,
    timerRoute,
    fileRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
