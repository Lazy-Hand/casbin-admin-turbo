import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/index.vue'

export default [
  {
    path: '/system',
    name: 'System',
    meta: {
      title: '系统管理',
      icon: 'antd:SettingOutlined',
      type: 'menu',
    },
    redirect: '/system/user',
    component: AppLayout,
    children: [
      {
        path: '/system/user',
        name: 'SystemUser',
        meta: {
          title: '用户管理',
          icon: 'antd:UserOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/user/index.vue'),
      },
      {
        path: '/system/role',
        name: 'SystemRole',
        meta: {
          title: '角色管理',
          icon: 'antd:TeamOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/role/index.vue'),
      },
      {
        path: '/system/dept',
        name: 'SystemDept',
        meta: {
          title: '部门管理',
          icon: 'antd:ApartmentOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/dept/index.vue'),
      },
      {
        path: '/system/post',
        name: 'SystemPost',
        meta: {
          title: '岗位管理',
          icon: 'antd:SolutionOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/post/index.vue'),
      },
      {
        path: '/system/menu',
        name: 'SystemMenu',
        meta: {
          title: '菜单管理',
          icon: 'antd:MenuOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/menu/index.vue'),
      },
      {
        path: '/system/timer',
        name: 'SystemTimer',
        meta: {
          title: '定时任务',
          icon: 'antd:ClockCircleOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/timer/index.vue'),
      },
      {
        path: '/system/file',
        name: 'SystemFile',
        meta: {
          title: '文件管理',
          icon: 'antd:FolderOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/file/index.vue'),
      },
      {
        path: '/system/dictionary',
        name: 'SystemDictionary',
        meta: {
          title: '字典管理',
          icon: 'antd:BookOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/dictionary/index.vue'),
      },
      {
        path: '/system/log',
        name: 'SystemLog',
        meta: {
          title: '日志管理',
          icon: 'antd:FileTextOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/system/log/index.vue'),
      },
    ],
  },
] as RouteRecordRaw[]
