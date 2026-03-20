<template>
  <NRadioGroup v-bind="bindings" :name="name">
    <div class="flex flex-wrap gap-4">
      <NRadio
        v-for="item in items"
        :key="item.value"
        :value="formatValue(item.value)"
        :label="item.label"
      />
    </div>
  </NRadioGroup>
</template>

<script setup lang="ts">
import { useDict } from '@/composables/useDict'
import { useAttrs, computed } from 'vue'
import { NRadioGroup, NRadio } from 'naive-ui'

const props = defineProps<{
  dictCode: string
}>()

const model = defineModel<string | number>('value')
const attrs = useAttrs()

const { items } = useDict(props.dictCode)

const name = computed(() => attrs.name as string | undefined)

const bindings = computed(() => {
  if (name.value && model.value === undefined) {
    return {
      'onUpdate:value': (val: string | number) => (model.value = val),
    }
  }
  return {
    value: formatValue(model.value),
    'onUpdate:value': (val: string | number) => (model.value = val),
  }
})

const formatValue = (val: string | number | undefined) => {
  if (val === undefined) return ''
  const strVal = String(val)
  const num = Number(strVal)
  return isNaN(num) ? strVal : num
}
</script>
