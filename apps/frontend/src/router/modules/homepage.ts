import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/index.vue'
export default [
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: {
      title: 'Dashboard',
      icon: 'antd:HomeOutlined',
      type: 'menu',
    },
    redirect: '/dashboard/workbench',
    component: AppLayout,
    children: [
      {
        path: '/dashboard/workbench',
        name: 'Workbench',
        meta: {
          title: 'Workbench',
          icon: 'antd:AppstoreOutlined',
          type: 'page',
          cache: true,
        },
        component: () => import('@/views/dashboard/workbench/index.vue'),
      },
      {
        path: '/dashboard/monitor',
        name: 'Monitor',
        meta: {
          title: 'Monitor',
          icon: 'antd:BarChartOutlined',
          type: 'page',
          cache: false,
        },
        component: () => import('@/views/dashboard/monitor/index.vue'),
      },
    ],
  },
  {
    path: '/landing',
    name: 'Landing',
    component: () => import('@/views/pages/landing/index.vue'),
    meta: {
      title: 'Landing',
      icon: 'antd:ExportOutlined',
      type: 'window',
      target: '_blank',
    },
  },
] as RouteRecordRaw[]
