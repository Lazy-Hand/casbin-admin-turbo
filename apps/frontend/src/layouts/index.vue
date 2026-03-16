<template>
  <div class="h-screen">
    <ProLayout
      :mode="layoutConfig.layoutMode"
      :sidebar-width="sidebarWidth"
      :sidebar-collapsed-width="sidebarCollapsedWidth"
      nav-fixed
      show-nav
      show-sidebar
      :collapsed="layoutState.collapsed"
    >
      <template #logo>
        <AppLogo :collapsed="layoutState.collapsed" />
      </template>
      <template #sidebar>
        <n-scrollbar class="flex-[1_0_0]">
          <n-menu v-bind="layout.verticalMenuProps" :collapsed-width="sidebarCollapsedWidth" />
        </n-scrollbar>
      </template>
      <template #nav-left>
        <AppHeaderLeft />
      </template>
      <template #nav-right>
        <AppHeaderRight />
      </template>
      <template #tabbar>
        <AppTabs />
      </template>
      <template #footer>
        <AppFooter />
      </template>
      <div class="bg-background">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="tabsStore.cachedViews">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </div>
    </ProLayout>
  </div>
</template>

<script setup lang="ts">
import AppHeaderLeft from './AppHeaderLeft.vue'
import AppHeaderRight from './AppHeaderRight.vue'
import AppTabs from './AppTabs.vue'
import AppFooter from './AppFooter.vue'
import { useTabsStore } from '@/stores/tabs'
import { ProLayout, useLayoutMenu, type ProLayoutMode } from 'pro-naive-ui'
import AppLogo from './AppMenu/AppLogo.vue'
import { useLayout } from './composables/useLayout'
import { useMenu } from './composables/useMenu'
const { layoutConfig } = useLayout()
defineOptions({
  name: 'AppLayout',
})
const route = useRoute()
const mode = ref<ProLayoutMode>('vertical')
const { layoutState } = useLayout()
const tabsStore = useTabsStore()
const { menuOptions } = useMenu()
const { layout, activeKey } = useLayoutMenu({
  mode,
  accordion: true,
  menus: menuOptions,
})

const sidebarWidth = ref(220)
const sidebarCollapsedWidth = ref(64)
watch(
  () => route.name,
  () => {
    activeKey.value = route.name as string
  },
  { immediate: true },
)
</script>

<style scoped lang="scss"></style>
