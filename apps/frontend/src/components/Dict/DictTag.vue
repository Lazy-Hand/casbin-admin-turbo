<template>
  <NTag v-if="item" :type="getType()" :bordered="false" size="small">
    {{ item.label }}
  </NTag>
  <span v-else>{{ value }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDict } from '@/composables/useDict'
import { NTag } from 'naive-ui'

const props = defineProps<{
  value: any
  dictCode: string
  // Map values to Naive UI types: default, primary, info, success, warning, error
  typeMap?: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>
}>()

const { items } = useDict(props.dictCode)

const item = computed(() => {
  return items.value.find((i) => i.value == String(props.value))
})

const getType = () => {
  if (props.typeMap && props.typeMap[String(props.value)]) {
    return props.typeMap[String(props.value)]
  }
  // Use colorType from dict item if available
  if (item.value?.colorType) {
    return item.value.colorType as 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  }
  return 'info'
}
</script>
