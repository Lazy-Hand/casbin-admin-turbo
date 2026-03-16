<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改字典项' : '新增字典项'"
    preset="card"
    class="w-full md:w-152.5!"
    @update:show="close"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="标签" path="label">
        <NInput v-model:value="formModel.label" placeholder="Enter label" autofocus />
      </NFormItem>
      <NFormItem label="值" path="value">
        <NInput v-model:value="formModel.value" placeholder="Enter value" />
      </NFormItem>
      <NFormItem label="颜色类型" path="colorType">
        <NInput v-model:value="formModel.colorType" placeholder="e.g. success, warning, error" />
      </NFormItem>
      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formModel.sort" placeholder="Enter sort order" />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <DictRadio dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" @click="handleSave">确认</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import type { DictionaryItem } from '@/api/dictionary'
import DictRadio from '@/components/Dict/DictRadio.vue'

const show = ref(false)
const currentId = ref<number>()
const dictTypeId = ref<number>()
const formRef = ref<FormInst | null>(null)

const formModel = ref<Partial<DictionaryItem>>({
  label: '',
  value: '',
  colorType: '',
  sort: 0,
  status: 1,
})

const isEdit = computed(() => !!currentId.value)

const rules: FormRules = {
  label: [{ required: true, message: 'Label is required', trigger: 'blur' }],
  value: [{ required: true, message: 'Value is required', trigger: 'blur' }],
  status: [{ type: 'number', required: true, message: 'Status is required', trigger: 'change' }],
}

const open = (item?: DictionaryItem, dictId?: number) => {
  if (item) {
    currentId.value = item.id
    dictTypeId.value = item.dictTypeId
    formModel.value = { ...item, status: Number(item.status) as 0 | 1 }
  } else {
    currentId.value = undefined
    dictTypeId.value = dictId
    formModel.value = {
      label: '',
      value: '',
      colorType: '',
      sort: 0,
      status: 1,
    }
  }
  show.value = true
}

const close = () => {
  show.value = false
}

const emit = defineEmits<{
  (e: 'success', payload: DictionaryItem): void
}>()

const handleSave = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      const payload = {
        ...formModel.value,
        id: currentId.value,
        dictTypeId: dictTypeId.value,
        status: formModel.value.status as 0 | 1,
      } as DictionaryItem
      emit('success', payload)
      close()
    }
  })
}

defineExpose({
  open,
  close,
})
</script>
