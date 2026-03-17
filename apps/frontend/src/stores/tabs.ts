import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  title: string
  fullPath: string
  name: string
  icon?: string
  affix?: boolean
}

const HOME_TAB: TabItem = {
  title: '首页',
  fullPath: '/home',
  name: 'Home',
  icon: 'antd:HomeOutlined',
  affix: true,
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([{ ...HOME_TAB }])
  const cachedViews = ref<string[]>([HOME_TAB.name])

  const addTab = (route: RouteLocationNormalized) => {
    const { name, fullPath, meta } = route
    if (!name || typeof name !== 'string') return

    // Verify if tab already exists
    const exists = tabs.value.some((tab) => tab.fullPath === fullPath)
    if (!exists) {
      tabs.value.push({
        title: (meta.title as string) || 'Unknown',
        fullPath,
        name: name,
        icon: (meta.icon as string) || '',
        affix: Boolean(meta.affix),
      })
    }

    // Add to cache if not already cached and not explicitly excluded
    // Use meta.cache === false or meta.noCache to prevent caching
    const shouldCache = meta.cache !== false && !meta.noCache
    if (!cachedViews.value.includes(name) && shouldCache) {
      cachedViews.value.push(name)
    }
  }

  const removeTab = (fullPath: string) => {
    const index = tabs.value.findIndex((tab) => tab.fullPath === fullPath)
    if (index !== -1) {
      const tab = tabs.value[index]
      if (tab?.affix) {
        return index
      }
      if (tab) {
        removeCache(tab.name)
        tabs.value.splice(index, 1)
      }
    }
    return index
  }

  const removeCache = (name: string) => {
    const index = cachedViews.value.indexOf(name)
    if (index > -1) {
      cachedViews.value.splice(index, 1)
    }
  }

  const closeAllTabs = () => {
    tabs.value = [{ ...HOME_TAB }]
    cachedViews.value = [HOME_TAB.name]
  }

  const closeOtherTabs = (currentFullPath: string) => {
    const currentTab = tabs.value.find((tab) => tab.fullPath === currentFullPath)
    if (currentTab) {
      tabs.value = tabs.value.filter((tab) => tab.affix || tab.fullPath === currentFullPath)
      cachedViews.value = tabs.value.map((tab) => tab.name)
    }
  }

  return {
    tabs,
    cachedViews,
    addTab,
    removeTab,
    removeCache,
    closeAllTabs,
    closeOtherTabs,
  }
})
