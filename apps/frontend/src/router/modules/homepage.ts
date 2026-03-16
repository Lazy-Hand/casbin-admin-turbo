import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/index.vue'
export default [
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: {
      title: 'Dashboard',
      icon: 'pi pi-fw pi-home',
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
          icon: 'pi pi-fw pi-th-large',
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
          icon: 'pi pi-fw pi-chart-bar',
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
      icon: 'pi pi-fw pi-external-link',
      type: 'window',
      target: '_blank',
    },
  },
] as RouteRecordRaw[]
