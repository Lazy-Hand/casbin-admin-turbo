<template>
  <NModal
    :show="visible"
    preset="card"
    title="选择图标"
    class="w-full md:w-240!"
    @update:show="close"
  >
    <NTabs v-model:value="activeTab" type="line" animated>
      <NTabPane name="primeicon" tab="PrimeIcons">
        <div class="mb-4 flex gap-2">
          <NInput v-model:value="primeSearch" placeholder="搜索图标..." clearable class="flex-1">
            <template #prefix>
              <i class="pi pi-search"></i>
            </template>
          </NInput>
          <NSelect
            v-model:value="primeIconsPage"
            :options="primePageOptions"
            style="width: 120px"
            size="small"
          />
          <span class="text-sm text-gray-500 flex items-center">
            共 {{ filteredPrimeIcons.length }} 个
          </span>
        </div>
        <div class="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="icon in searchPaginatedPrimeIcons"
            :key="icon.className"
            class="flex flex-col items-center justify-center p-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :class="{ 'bg-primary/10 text-primary': selectedIcon === `primeicon:${icon.name}` }"
            @click="selectIcon(icon.name, 'primeicon')"
          >
            <i :class="icon.className" class="text-2xl mb-1"></i>
            <span class="text-xs text-center truncate w-full">{{ icon.name }}</span>
          </div>
        </div>
        <div class="flex justify-center items-center gap-2 mt-4">
          <NButton size="small" :disabled="primeIconsPage <= 1" @click="primeIconsPage--">
            上一页
          </NButton>
          <span class="text-sm text-gray-500">
            {{ primeIconsPage }} / {{ searchPrimeIconsTotalPages }}
          </span>
          <NButton
            size="small"
            :disabled="primeIconsPage >= searchPrimeIconsTotalPages"
            @click="primeIconsPage++"
          >
            下一页
          </NButton>
        </div>
      </NTabPane>

      <NTabPane name="material" tab="Material Icons">
        <div class="mb-4 flex gap-2">
          <NInput v-model:value="materialSearch" placeholder="搜索图标..." clearable class="flex-1">
            <template #prefix>
              <i class="pi pi-search"></i>
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
          <i class="pi pi-spinner pi-spin text-2xl"></i>
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
    </NTabs>

    <template #footer>
      <div class="flex justify-between">
        <NButton @click="clearIcon" v-if="selectedIcon">清除</NButton>
        <div class="flex justify-end gap-2">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" :disabled="!selectedIcon" @click="confirm">确定</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NModal, NTabs, NTabPane, NInput, NButton, NIcon, NSelect } from 'naive-ui'
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
  primeIconsPage,
  materialIconsPage,
  loadMaterialIcons,
  primeIconsList,
  materialIconsList,
  PAGE_SIZE,
} = useIconLoader()

const activeTab = ref<'primeicon' | 'material'>('primeicon')
const primeSearch = ref('')
const materialSearch = ref('')
const selectedIcon = ref<string>(props.value || '')

// 搜索过滤
const filteredPrimeIcons = computed(() => {
  if (!primeSearch.value) return primeIconsList.value
  return primeIconsList.value.filter((icon) =>
    icon.name.toLowerCase().includes(primeSearch.value.toLowerCase()),
  )
})

const filteredMaterialIcons = computed(() => {
  if (!materialSearch.value) return materialIconsList.value
  return materialIconsList.value.filter(
    (icon) =>
      icon.name.toLowerCase().includes(materialSearch.value.toLowerCase()) ||
      icon.displayName.toLowerCase().includes(materialSearch.value.toLowerCase()),
  )
})

// 重新计算分页（基于搜索结果）
const searchPaginatedPrimeIcons = computed(() => {
  const start = (primeIconsPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredPrimeIcons.value.slice(start, end)
})

const searchPrimeIconsTotalPages = computed(() => {
  return Math.ceil(filteredPrimeIcons.value.length / PAGE_SIZE) || 1
})

const searchPaginatedMaterialIcons = computed(() => {
  const start = (materialIconsPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredMaterialIcons.value.slice(start, end)
})

const searchMaterialIconsTotalPages = computed(() => {
  return Math.ceil(filteredMaterialIcons.value.length / PAGE_SIZE) || 1
})

// 页码选项
const primePageOptions = computed(() => {
  const pages = searchPrimeIconsTotalPages.value
  return Array.from({ length: pages }, (_, i) => ({
    label: `第 ${i + 1} 页`,
    value: i + 1,
  }))
})

const materialPageOptions = computed(() => {
  const pages = searchMaterialIconsTotalPages.value
  return Array.from({ length: Math.min(pages, 100) }, (_, i) => ({
    label: `第 ${i + 1} 页`,
    value: i + 1,
  }))
})

// 搜索时重置页码
watch(primeSearch, () => {
  primeIconsPage.value = 1
})

watch(materialSearch, () => {
  materialIconsPage.value = 1
})

const selectIcon = (iconName: string, type: 'primeicon' | 'material') => {
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
  }
})

onMounted(() => {
  if (activeTab.value === 'material') {
    loadMaterialIcons()
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
