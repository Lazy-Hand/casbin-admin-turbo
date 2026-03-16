<template>
  <NCheckboxGroup v-bind="bindings">
    <div class="flex flex-wrap gap-4">
      <NCheckbox
        v-for="item in items"
        :key="item.value"
        :value="formatValue(item.value)"
        :label="item.label"
      />
    </div>
  </NCheckboxGroup>
</template>

<script setup lang="ts">
import { useDict } from '@/composables/useDict'
import { useAttrs, computed } from 'vue'
import { NCheckboxGroup, NCheckbox } from 'naive-ui'

const props = defineProps<{
  dictCode: string
}>()

const model = defineModel<any[]>('value')
const attrs = useAttrs()

const { items } = useDict(props.dictCode)

const bindings = computed(() => {
  // Naive UI v-model is 'value'
  if (attrs.name && model.value === undefined) {
    return {
      'onUpdate:value': (val: any) => (model.value = val),
    }
  }
  return {
    value: model.value,
    'onUpdate:value': (val: any) => (model.value = val),
  }
})

const formatValue = (val: string) => {
  // If your model uses numbers, parsing is needed.
  // If strings, removing helper.
  // Naive UI Checkbox value can be string or number.
  const num = Number(val)
  return isNaN(num) ? val : num
}
</script>
