import type { ReactNode } from 'react'
import {
  ClusterOutlined,
  ExperimentOutlined,
  FileOutlined,
  HomeOutlined,
  MenuOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'

export type LocalRouteConfig = {
  key: string
  path: string
  title: string
  icon?: ReactNode
  menuVisible?: boolean
}

export const localRoutes: LocalRouteConfig[] = [
  {
    key: 'home',
    path: '/',
    title: '首页',
    icon: <HomeOutlined />,
    menuVisible: true,
  },
  {
    key: 'playground',
    path: '/playground',
    title: 'Playground',
    icon: <ExperimentOutlined />,
    menuVisible: false,
  },
  {
    key: 'dashboard-workbench',
    path: '/dashboard/workbench',
    title: '工作台',
    icon: <HomeOutlined />,
    menuVisible: false,
  },
  {
    key: 'dashboard-monitor',
    path: '/dashboard/monitor',
    title: '监控页',
    icon: <HomeOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-user',
    path: '/system/user',
    title: '用户管理',
    icon: <UserOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-role',
    path: '/system/role',
    title: '角色管理',
    icon: <TeamOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-menu',
    path: '/system/menu',
    title: '菜单管理',
    icon: <MenuOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-dept',
    path: '/system/dept',
    title: '部门管理',
    icon: <ClusterOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-post',
    path: '/system/post',
    title: '岗位管理',
    icon: <TeamOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-config',
    path: '/system/config',
    title: '参数配置',
    icon: <SettingOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-dictionary',
    path: '/system/dictionary',
    title: '字典管理',
    icon: <SettingOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-log',
    path: '/system/log',
    title: '操作日志',
    icon: <SettingOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-timer',
    path: '/system/timer',
    title: '定时任务',
    icon: <ScheduleOutlined />,
    menuVisible: false,
  },
  {
    key: 'system-file',
    path: '/system/file',
    title: '文件管理',
    icon: <FileOutlined />,
    menuVisible: false,
  },
]

export const localRoutePaths = new Set(localRoutes.map((item) => item.path))

export function getLocalRouteByPath(path: string) {
  return localRoutes.find((item) => item.path === path)
}
