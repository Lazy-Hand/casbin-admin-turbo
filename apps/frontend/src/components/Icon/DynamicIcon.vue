<template>
  <span v-if="!iconValue"></span>
  <component v-else-if="iconComponent" :is="iconComponent" class="text-lg"></component>
  <span v-else class="text-lg"></span>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = defineProps<{
  icon?: string
}>()

const iconValue = computed(() => props.icon || '')
const iconComponent = shallowRef<unknown>(null)

const iconMeta = computed(() => {
  if (!iconValue.value) return null

  const [library, name] = iconValue.value.split(':')
  if (!library || !name || !['material', 'antd', 'ionicons5'].includes(library)) return null

  return {
    library,
    name,
  }
})

watch(
  () => iconMeta.value,
  async (meta) => {
    if (!meta) {
      iconComponent.value = null
      return
    }

    try {
      const iconLibraries = {
        material: () => import('@vicons/material'),
        antd: () => import('@vicons/antd'),
        ionicons5: () => import('@vicons/ionicons5'),
      }

      const iconsModule = await iconLibraries[meta.library as keyof typeof iconLibraries]()
      iconComponent.value = iconsModule[meta.name as keyof typeof iconsModule] ?? null
    } catch (error) {
      console.error(`Failed to load icon: ${meta.library}:${meta.name}`, error)
      iconComponent.value = null
    }
  },
  { immediate: true },
)
</script>
