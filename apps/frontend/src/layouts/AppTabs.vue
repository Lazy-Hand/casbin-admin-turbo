<template>
  <div class="app-tabs">
    <!-- Left Scroll Button -->
    <NButton v-if="isScrollable" text class="w-8 h-full shrink-0" @click="scrollLeft">
      <template #icon>
        <NIcon size="16">
          <AppIcon icon="antd:LeftOutlined" />
        </NIcon>
      </template>
    </NButton>

    <!-- Tabs Container -->
    <div ref="scrollContainer"
      class="flex-1 overflow-x-auto hide-scrollbar flex items-center gap-1 mx-1 h-full select-none"
      @wheel.prevent="handleWheel">
      <VueDraggable v-model="draggableTabs" item-key="fullPath" class="flex items-center gap-1 min-w-max h-full"
        :animation="180" ghost-class="app-tab-ghost" chosen-class="app-tab-chosen" :move="handleTabMove">
        <div v-for="tab in draggableTabs" :key="tab.fullPath" :ref="(el) => setTabRef(el, tab.fullPath)"
          class="group relative flex items-center px-3 py-1.5 h-7.5 text-xs transition-all duration-300 rounded cursor-pointer border border-transparent whitespace-nowrap"
          :class="[
            tab.fullPath === route.fullPath
              ? 'active-tab'
              : 'text-gray-600 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#2d2d30] hover:text-gray-900 dark:hover:text-gray-200',
            tab.affix ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
          ]" :style="tab.fullPath === route.fullPath
            ? { backgroundColor: themeVars.primaryColorSuppl, color: '#fff' }
            : {}
            " @click="handleTabClick(tab)" @contextmenu.prevent="(e) => handleContextMenu(e, tab)">
          <div class="flex items-center">
            <!-- Tab Icon (Optional) -->
            <IconRender v-if="tab.icon" :iconValue="tab.icon" class="mr-1.5" />
            <!-- Tab Title -->
            <span>{{ tab.title }}</span>
          </div>

          <!-- Close Button -->
          <span v-if="!tab.affix"
            class="text-xs! ml-2 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            :class="{ 'opacity-100!': tab.fullPath === route.fullPath }" @click.stop="handleCloseTab(tab.fullPath)">
            <IconRender iconValue="antd:CloseOutlined" />
          </span>
        </div>
      </VueDraggable>
    </div>

    <!-- Right Scroll Button -->
    <NButton v-if="isScrollable" text class="w-8 h-full shrink-0" @click="scrollRight">
      <template #icon>
        <NIcon size="16">
          <AppIcon icon="antd:RightOutlined" />
        </NIcon>
      </template>
    </NButton>

    <!-- Context Menu -->
    <NDropdown placement="bottom-start" trigger="manual" :x="contextMenuX" :y="contextMenuY"
      :options="contextMenuOptions" :show="showContextMenu" :on-clickoutside="closeContextMenu"
      @select="handleContextMenuSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeVars, NIcon, NButton, NDropdown } from 'naive-ui'
import { VueDraggable } from 'vue-draggable-plus'
import { useTabsStore } from '@/stores/tabs'
import type { TabItem } from '@/stores/tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const themeVars = useThemeVars()

const scrollContainer = ref<HTMLElement | null>(null)
const tabRefs = ref<Map<string, HTMLElement>>(new Map())
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const currentContextTab = ref<string>('')
const isScrollable = ref(false)

const draggableTabs = computed({
  get: () => tabsStore.tabs,
  set: (value: TabItem[]) => {
    tabsStore.reorderTabs(value)
  },
})

// Set Tab functionality for scrolling
const setTabRef = (el: any, fullPath: string) => {
  if (el) {
    tabRefs.value.set(fullPath, el)
  }
}

const checkScrollable = () => {
  if (scrollContainer.value) {
    const { scrollWidth, clientWidth } = scrollContainer.value
    isScrollable.value = scrollWidth > clientWidth
  }
}

// Watch route to add tabs and scroll into view
watch(
  () => route.fullPath,
  async (newPath) => {
    tabsStore.addTab(route)
    await nextTick()
    checkScrollable()
    scrollToTab(newPath)
  },
  { immediate: true },
)

watch(
  () => tabsStore.tabs.length,
  async () => {
    await nextTick()
    checkScrollable()
  },
)

onMounted(() => {
  if (scrollContainer.value) {
    const resizeObserver = new ResizeObserver(() => {
      checkScrollable()
    })
    resizeObserver.observe(scrollContainer.value)

    // Also observe window resize for safety
    window.addEventListener('resize', checkScrollable)

    // Cleanup
    onUnmounted(() => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkScrollable)
    })
  }
})

// Scroll Logic
const handleWheel = (e: WheelEvent) => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY * 0.5
  }
}

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}

const scrollToTab = (fullPath: string) => {
  const tabEl = tabRefs.value.get(fullPath)
  const container = scrollContainer.value
  if (tabEl && container) {
    const { offsetLeft, offsetWidth } = tabEl
    const { scrollLeft, clientWidth } = container

    if (offsetLeft < scrollLeft) {
      container.scrollTo({ left: offsetLeft, behavior: 'smooth' })
    } else if (offsetLeft + offsetWidth > scrollLeft + clientWidth) {
      container.scrollTo({
        left: offsetLeft + offsetWidth - clientWidth,
        behavior: 'smooth',
      })
    }
  }
}

// Tab Actions
const handleTabClick = (tab: any) => {
  router.push(tab.fullPath)
}

const handleTabMove = ({
  draggedContext,
  relatedContext,
}: {
  draggedContext?: { element?: TabItem }
  relatedContext?: { element?: TabItem; index?: number }
}) => {
  if (draggedContext?.element?.affix) {
    return false
  }

  if (relatedContext?.element?.affix || relatedContext?.index === 0) {
    return false
  }

  return true
}

const handleCloseTab = (fullPath: string) => {
  const index = tabsStore.removeTab(fullPath)
  if (fullPath === route.fullPath) {
    const nextTab = tabsStore.tabs[index] || tabsStore.tabs[index - 1]
    if (nextTab) {
      router.push(nextTab.fullPath)
    } else {
      router.push('/')
    }
  }
}

// Context Menu Logic
const contextMenuOptions = computed(() => [
  {
    label: 'Close Current',
    key: 'close',
    disabled:
      tabsStore.tabs.length <= 1 ||
      tabsStore.tabs.find((tab) => tab.fullPath === currentContextTab.value)?.affix === true,
  },
  { label: 'Close Others', key: 'close-others', disabled: tabsStore.tabs.length <= 1 },
  { label: 'Close All', key: 'close-all', disabled: tabsStore.tabs.length <= 1 },
])

const handleContextMenu = (e: MouseEvent, tab: any) => {
  e.preventDefault()
  showContextMenu.value = false
  nextTick().then(() => {
    currentContextTab.value = tab.fullPath
    contextMenuX.value = e.clientX
    contextMenuY.value = e.clientY
    showContextMenu.value = true
  })
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const handleContextMenuSelect = (key: string) => {
  showContextMenu.value = false
  const path = currentContextTab.value

  switch (key) {
    case 'close':
      handleCloseTab(path)
      break
    case 'close-others':
      tabsStore.closeOtherTabs(path)
      if (path !== route.fullPath) {
        router.push(path)
      }
      break
    case 'close-all':
      tabsStore.closeAllTabs()
      router.push('/')
      break
  }
}
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.active-tab {
  /* Ensure active tab stands out */
  position: relative;
}

.active-tab::after {
  content: '';
  position: absolute;
  bottom: -6px;
  /* Matches parent padding/height adjustment */
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--n-primary-color);
  opacity: 1;
  /* Optional: Toggle if you want bottom border indicator */
}
</style>
