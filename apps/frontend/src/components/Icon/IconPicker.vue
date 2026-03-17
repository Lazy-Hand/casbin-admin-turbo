<template>
  <NModal
    :show="visible"
    preset="card"
    title="选择图标"
    class="w-full md:w-240!"
    @update:show="close"
  >
    <NTabs v-model:value="activeTab" type="line" animated>
      <NTabPane name="antd" tab="Ant Design">
        <div class="mb-4 flex gap-2">
          <NInput v-model:value="antdSearch" placeholder="搜索图标..." clearable class="flex-1">
            <template #prefix>
              <AppIcon icon="antd:SearchOutlined" />
            </template>
          </NInput>
          <NSelect
            v-model:value="antdIconsPage"
            :options="antdPageOptions"
            style="width: 120px"
            size="small"
          />
          <span class="text-sm text-gray-500 flex items-center">
            共 {{ filteredAntdIcons.length }} 个
          </span>
        </div>
        <div v-if="loadingAntd" class="text-center py-8">
          <AppIcon icon="antd:LoadingOutlined" class="text-2xl animate-spin" />
          <p class="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
        <div v-else-if="filteredAntdIcons.length === 0" class="text-center py-8">
          <p class="text-sm text-gray-500">没有找到图标</p>
        </div>
        <div v-else class="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="icon in searchPaginatedAntdIcons"
            :key="icon.name"
            class="flex flex-col items-center justify-center p-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-primary/10 text-primary': selectedIcon === `antd:${icon.name}` }"
            @click="selectIcon(icon.name, 'antd')"
          >
            <NIcon>
              <component :is="icon.component" class="text-2xl mb-1"></component>
            </NIcon>
            <span class="text-xs text-center truncate w-full mt-2">{{ icon.displayName }}</span>
          </div>
        </div>
        <div
          v-if="!loadingAntd && filteredAntdIcons.length > 0"
          class="flex justify-center items-center gap-2 mt-4"
        >
          <NButton size="small" :disabled="antdIconsPage <= 1" @click="antdIconsPage--">
            上一页
          </NButton>
          <span class="text-sm text-gray-500">
            {{ antdIconsPage }} / {{ searchAntdIconsTotalPages }}
          </span>
          <NButton
            size="small"
            :disabled="antdIconsPage >= searchAntdIconsTotalPages"
            @click="antdIconsPage++"
          >
            下一页
          </NButton>
        </div>
      </NTabPane>

      <NTabPane name="material" tab="Material Icons">
        <div class="mb-4 flex gap-2">
          <NInput v-model:value="materialSearch" placeholder="搜索图标..." clearable class="flex-1">
            <template #prefix>
              <AppIcon icon="antd:SearchOutlined" />
            </template>
          </NInput>
          <NSelect
            v-model:value="materialIconsPage"
            :options="materialPageOptions"
            style="width: 120px"
            size="small"
          />
          <span class="text-sm text-gray-500 flex items-center">
            共 {{ filteredMaterialIcons.length }} 个
          </span>
        </div>
        <div v-if="loadingMaterial" class="text-center py-8">
          <AppIcon icon="antd:LoadingOutlined" class="text-2xl animate-spin" />
          <p class="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
        <div v-else-if="filteredMaterialIcons.length === 0" class="text-center py-8">
          <p class="text-sm text-gray-500">没有找到图标</p>
        </div>
        <div v-else class="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="icon in searchPaginatedMaterialIcons"
            :key="icon.name"
            class="flex flex-col items-center justify-center p-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-primary/10 text-primary': selectedIcon === `material:${icon.name}` }"
            @click="selectIcon(icon.name, 'material')"
          >
            <NIcon>
              <component :is="icon.component" class="text-2xl mb-1"></component>
            </NIcon>
            <span class="text-xs text-center truncate w-full mt-2">{{ icon.displayName }}</span>
          </div>
        </div>
        <div
          v-if="!loadingMaterial && filteredMaterialIcons.length > 0"
          class="flex justify-center items-center gap-2 mt-4"
        >
          <NButton size="small" :disabled="materialIconsPage <= 1" @click="materialIconsPage--">
            上一页
          </NButton>
          <span class="text-sm text-gray-500">
            {{ materialIconsPage }} / {{ searchMaterialIconsTotalPages }}
          </span>
          <NButton
            size="small"
            :disabled="materialIconsPage >= searchMaterialIconsTotalPages"
            @click="materialIconsPage++"
          >
            下一页
          </NButton>
        </div>
      </NTabPane>

      <NTabPane name="ionicons5" tab="Ionicons5">
        <div class="mb-4 flex gap-2">
          <NInput v-model:value="ioniconsSearch" placeholder="搜索图标..." clearable class="flex-1">
            <template #prefix>
              <AppIcon icon="antd:SearchOutlined" />
            </template>
          </NInput>
          <NSelect
            v-model:value="ioniconsIconsPage"
            :options="ioniconsPageOptions"
            style="width: 120px"
            size="small"
          />
          <span class="text-sm text-gray-500 flex items-center">
            共 {{ filteredIoniconsIcons.length }} 个
          </span>
        </div>
        <div v-if="loadingIonicons" class="text-center py-8">
          <AppIcon icon="antd:LoadingOutlined" class="text-2xl animate-spin" />
          <p class="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
        <div v-else-if="filteredIoniconsIcons.length === 0" class="text-center py-8">
          <p class="text-sm text-gray-500">没有找到图标</p>
        </div>
        <div v-else class="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="icon in searchPaginatedIoniconsIcons"
            :key="icon.name"
            class="flex flex-col items-center justify-center p-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-primary/10 text-primary': selectedIcon === `ionicons5:${icon.name}` }"
            @click="selectIcon(icon.name, 'ionicons5')"
          >
            <NIcon>
              <component :is="icon.component" class="text-2xl mb-1"></component>
            </NIcon>
            <span class="text-xs text-center truncate w-full mt-2">{{ icon.displayName }}</span>
          </div>
        </div>
        <div
          v-if="!loadingIonicons && filteredIoniconsIcons.length > 0"
          class="flex justify-center items-center gap-2 mt-4"
        >
          <NButton
            size="small"
            :disabled="ioniconsIconsPage <= 1"
            @click="ioniconsIconsPage--"
          >
            上一页
          </NButton>
          <span class="text-sm text-gray-500">
            {{ ioniconsIconsPage }} / {{ searchIoniconsIconsTotalPages }}
          </span>
          <NButton
            size="small"
            :disabled="ioniconsIconsPage >= searchIoniconsIconsTotalPages"
            @click="ioniconsIconsPage++"
          >
            下一页
          </NButton>
        </div>
      </NTabPane>
    </NTabs>

    <template #footer>
      <div class="flex justify-between">
        <NButton v-if="selectedIcon" @click="clearIcon">清除</NButton>
        <div class="flex justify-end gap-2">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" :disabled="!selectedIcon" @click="confirm">确定</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NIcon, NInput, NModal, NSelect, NTabPane, NTabs } from 'naive-ui'
import { useIconLoader } from './useIconLoader'

const props = defineProps<{
  visible: boolean
  value?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:value', value: string): void
}>()

const {
  loadingMaterial,
  loadingAntd,
  loadingIonicons,
  materialIconsPage,
  antdIconsPage,
  ioniconsIconsPage,
  loadMaterialIcons,
  loadAntdIcons,
  loadIoniconsIcons,
  materialIconsList,
  antdIconsList,
  ioniconsIconsList,
  PAGE_SIZE,
} = useIconLoader()

const activeTab = ref<'material' | 'antd' | 'ionicons5'>('antd')
const materialSearch = ref('')
const antdSearch = ref('')
const ioniconsSearch = ref('')
const selectedIcon = ref<string>(props.value || '')

const filteredMaterialIcons = computed(() => {
  if (!materialSearch.value) return materialIconsList.value
  return materialIconsList.value.filter(
    (icon) =>
      icon.name.toLowerCase().includes(materialSearch.value.toLowerCase()) ||
      icon.displayName.toLowerCase().includes(materialSearch.value.toLowerCase()),
  )
})

const filteredAntdIcons = computed(() => {
  if (!antdSearch.value) return antdIconsList.value
  return antdIconsList.value.filter(
    (icon) =>
      icon.name.toLowerCase().includes(antdSearch.value.toLowerCase()) ||
      icon.displayName.toLowerCase().includes(antdSearch.value.toLowerCase()),
  )
})

const filteredIoniconsIcons = computed(() => {
  if (!ioniconsSearch.value) return ioniconsIconsList.value
  return ioniconsIconsList.value.filter(
    (icon) =>
      icon.name.toLowerCase().includes(ioniconsSearch.value.toLowerCase()) ||
      icon.displayName.toLowerCase().includes(ioniconsSearch.value.toLowerCase()),
  )
})

const searchPaginatedMaterialIcons = computed(() => {
  const start = (materialIconsPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredMaterialIcons.value.slice(start, end)
})

const searchMaterialIconsTotalPages = computed(() => {
  return Math.ceil(filteredMaterialIcons.value.length / PAGE_SIZE) || 1
})

const searchPaginatedAntdIcons = computed(() => {
  const start = (antdIconsPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredAntdIcons.value.slice(start, end)
})

const searchAntdIconsTotalPages = computed(() => {
  return Math.ceil(filteredAntdIcons.value.length / PAGE_SIZE) || 1
})

const searchPaginatedIoniconsIcons = computed(() => {
  const start = (ioniconsIconsPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredIoniconsIcons.value.slice(start, end)
})

const searchIoniconsIconsTotalPages = computed(() => {
  return Math.ceil(filteredIoniconsIcons.value.length / PAGE_SIZE) || 1
})

const materialPageOptions = computed(() => {
  const pages = searchMaterialIconsTotalPages.value
  return Array.from({ length: Math.min(pages, 100) }, (_, i) => ({
    label: `第 ${i + 1} 页`,
    value: i + 1,
  }))
})

const antdPageOptions = computed(() => {
  const pages = searchAntdIconsTotalPages.value
  return Array.from({ length: Math.min(pages, 100) }, (_, i) => ({
    label: `第 ${i + 1} 页`,
    value: i + 1,
  }))
})

const ioniconsPageOptions = computed(() => {
  const pages = searchIoniconsIconsTotalPages.value
  return Array.from({ length: Math.min(pages, 100) }, (_, i) => ({
    label: `第 ${i + 1} 页`,
    value: i + 1,
  }))
})

watch(materialSearch, () => {
  materialIconsPage.value = 1
})

watch(antdSearch, () => {
  antdIconsPage.value = 1
})

watch(ioniconsSearch, () => {
  ioniconsIconsPage.value = 1
})

const selectIcon = (iconName: string, type: 'material' | 'antd' | 'ionicons5') => {
  selectedIcon.value = `${type}:${iconName}`
}

const clearIcon = () => {
  selectedIcon.value = ''
}

const confirm = () => {
  emit('update:value', selectedIcon.value)
  close()
}

const close = () => {
  emit('update:visible', false)
}

watch(activeTab, (newTab) => {
  if (newTab === 'material') {
    loadMaterialIcons()
    return
  }

  if (newTab === 'antd') {
    loadAntdIcons()
    return
  }

  if (newTab === 'ionicons5') {
    loadIoniconsIcons()
  }
})

onMounted(() => {
  if (activeTab.value === 'material') {
    loadMaterialIcons()
    return
  }

  if (activeTab.value === 'antd') {
    loadAntdIcons()
    return
  }

  if (activeTab.value === 'ionicons5') {
    loadIoniconsIcons()
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
</style>
