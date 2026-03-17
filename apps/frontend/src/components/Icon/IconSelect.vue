<template>
  <NInput v-model:value="iconValue" placeholder="点击选择图标" readonly>
    <template #prefix>
      <NIcon v-if="iconValue">
        <DynamicIcon :icon="iconValue" />
      </NIcon>
    </template>
    <template #suffix>
      <NIcon class="cursor-pointer" @click="showPicker = true">
        <DynamicIcon icon="antd:MoreOutlined" />
      </NIcon>
    </template>
  </NInput>

  <IconPicker v-model:visible="showPicker" v-model:value="iconValue" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue'
import { NInput } from 'naive-ui'
import DynamicIcon from './DynamicIcon.vue'

const IconPicker = defineAsyncComponent(() => import('./IconPicker.vue'))

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const iconValue = ref(props.modelValue || '')
const showPicker = ref(false)

watch(iconValue, (val) => {
  emit('update:modelValue', val || undefined)
})

watch(
  () => props.modelValue,
  (val) => {
    iconValue.value = val || ''
  },
)
</script>
