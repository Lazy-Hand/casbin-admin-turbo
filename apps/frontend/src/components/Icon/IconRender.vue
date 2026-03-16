<template>
  <NIcon>
    <i v-if="isPrimeIcon" :class="iconClass"></i>
    <component v-else-if="materialIconComponent" :is="materialIconComponent"></component>
    <i v-else :class="iconValue" style="font-size: 1rem"></i>
  </NIcon>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { NIcon } from 'naive-ui'

const props = defineProps<{
  iconValue: string
}>()

const iconValue = computed(() => props.iconValue || '')
const materialIconComponent = shallowRef<unknown>(null)

const isPrimeIcon = computed(() => {
  return iconValue.value && iconValue.value.startsWith('primeicon:')
})

const iconClass = computed(() => {
  if (isPrimeIcon.value) {
    const iconName = iconValue.value.replace('primeicon:', '')
    return `pi pi-${iconName}`
  }
  return iconValue.value
})

const materialIconName = computed(() => {
  if (!iconValue.value || !iconValue.value.startsWith('material:')) return ''
  return iconValue.value.replace('material:', '')
})

watch(
  () => materialIconName.value,
  async (iconName) => {
    if (!iconName) {
      materialIconComponent.value = null
      return
    }

    try {
      const MaterialIcons = await import('@vicons/material')
      materialIconComponent.value = MaterialIcons[iconName as keyof typeof MaterialIcons] ?? null
    } catch (error) {
      console.error(`Failed to load material icon: ${iconName}`, error)
      materialIconComponent.value = null
    }
  },
  { immediate: true },
)
</script>
