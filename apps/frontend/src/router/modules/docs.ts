import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/index.vue'
export default [
  {
    path: '/docs',
    name: 'Docs',
    component: AppLayout,
    redirect: '/docs/shadcn-vue',
    meta: {
      title: 'Docs',
      icon: 'antd:BookOutlined',
      type: 'menu',
    },
    children: [
      {
        path: '/docs/shadcn-vue',
        name: 'shadcnVueDocs',
        component: () => import('@/views/iframe/index.vue'),
        meta: {
          title: 'shadcn-vue',
          icon: 'antd:BookOutlined',
          type: 'iframe',
          frameUrl: 'https://shadcn-vue.com/',
        },
      },
      {
        path: '/docs/prime-vue',
        name: 'primeVueDocs',
        component: () => import('@/views/iframe/index.vue'),
        meta: {
          title: 'prime-vue',
          icon: 'antd:BookOutlined',
          type: 'iframe',
          frameUrl: 'https://primevue.org/',
        },
      },
      {
        path: '/docs/github',
        name: 'Github',
        component: AppLayout,
        meta: {
          title: 'Github',
          icon: 'antd:GithubOutlined',
          type: 'link',
          url: 'https://github.com/primefaces/primevue',
        },
      },
    ],
  },
] as RouteRecordRaw[]
