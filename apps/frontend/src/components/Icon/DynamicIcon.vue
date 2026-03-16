<template>
  <span v-if="!iconValue"></span>
  <i v-else-if="isPrimeIcon" :class="primeIconClass" class="text-lg"></i>
  <component
    v-else-if="materialIconComponent"
    :is="materialIconComponent"
    class="text-lg"
  ></component>
  <i v-else :class="iconValue" class="text-lg"></i>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = defineProps<{
  icon?: string
}>()

const iconValue = computed(() => props.icon || '')
const materialIconComponent = shallowRef<unknown>(null)

const isPrimeIcon = computed(() => {
  return iconValue.value && iconValue.value.startsWith('primeicon:')
})

const primeIconClass = computed(() => {
  if (!isPrimeIcon.value) return ''
  const iconName = iconValue.value.replace('primeicon:', '')
  return `pi ${iconName}`
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
