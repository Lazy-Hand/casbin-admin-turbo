<template>
  <NSelect
    v-model:value="model"
    :options="formattedOptions"
    :loading="loading"
    placeholder="请选择"
    clearable
  />
</template>

<script setup lang="ts">
import { useDict } from '@/composables/useDict'
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

const props = defineProps<{
  dictCode: string
}>()

const model = defineModel<string | number | null>('value')

const { items, loading } = useDict(props.dictCode)

const formattedOptions = computed(() => {
  return (
    items.value?.map((item) => {
      const numValue = Number(item.value)
      const isNumeric = !isNaN(numValue) && String(numValue) === item.value

      if (isNumeric) {
        // For numeric dictionary values, convert to number to match DB type
        return {
          label: item.label,
          value: numValue,
        }
      }

      return {
        label: item.label,
        value: item.value,
      }
    }) || []
  )
})
</script>
