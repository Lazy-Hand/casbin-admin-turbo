<template>
  <div class="header-left flex h-full items-center ml-4">
    <span
      v-show="!layoutState.collapsed"
      @click="toggle"
      class="cursor-pointer mr-4 flex items-center"
    >
      <AppIcon icon="antd:MenuFoldOutlined" />
    </span>
    <span
      v-show="layoutState.collapsed"
      @click="toggle"
      class="cursor-pointer mr-4 flex items-center"
    >
      <AppIcon icon="antd:MenuUnfoldOutlined" />
    </span>
    <NBreadcrumb>
      <NBreadcrumbItem>
        <router-link to="/">
          <NIcon><AppIcon icon="antd:HomeOutlined" /></NIcon>
        </router-link>
      </NBreadcrumbItem>
      <NBreadcrumbItem v-for="item in breadcrumbItems" :key="item.key">
        <router-link v-if="item.to" :to="item.to">{{ item.label }}</router-link>
        <span v-else>{{ item.label }}</span>
      </NBreadcrumbItem>
    </NBreadcrumb>
  </div>
</template>

<script setup lang="ts">
import { useLayout } from './composables/useLayout'

const route = useRoute()
// Breadcrumb Logic
const breadcrumbItems = computed(() => {
  return route.matched
    .filter((item) => item.meta && item.meta.title)
    .map((item) => ({
      label: item.meta.title as string,
      key: item.path,
      to: item.path === '/' ? undefined : item.path,
    }))
})
const { layoutState, toggleCollapsed } = useLayout()
const toggle = () => {
  toggleCollapsed()
}
</script>

<style lang="scss" scoped></style>
