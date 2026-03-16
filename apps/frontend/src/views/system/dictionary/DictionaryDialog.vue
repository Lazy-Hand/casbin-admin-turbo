<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改字典' : '新增字典'"
    preset="card"
    class="w-full md:w-155!"
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
      <NFormItem label="字典名称" path="dictName">
        <NInput v-model:value="formModel.dictName" placeholder="Enter name" />
      </NFormItem>
      <NFormItem label="字典编码" path="dictCode">
        <NInput v-model:value="formModel.dictCode" placeholder="Enter code" :disabled="isEdit" />
      </NFormItem>
      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="Enter description"
          :rows="3"
        />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <DictRadio dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSave">保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, type FormInst, type FormRules } from 'naive-ui'
import {
  createDictionary,
  updateDictionary,
  getDictionary,
  type Dictionary,
} from '@/api/dictionary'
import { useMessage } from 'naive-ui'
import DictRadio from '@/components/Dict/DictRadio.vue'

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)

const formModel = ref<Partial<Dictionary>>({
  dictName: '',
  dictCode: '',
  description: '',
  status: 1,
})

const isEdit = computed(() => !!currentId.value)

const rules: FormRules = {
  dictName: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  dictCode: [{ required: true, message: 'Code is required', trigger: 'blur' }],
  status: [{ type: 'number', required: true, message: 'Status is required', trigger: 'change' }],
}

const open = async (id?: number) => {
  currentId.value = id
  show.value = true
  if (id) {
    loading.value = true
    try {
      const res = await getDictionary(id)
      formModel.value = {
        ...res.data,
        status: Number(res.data.status) as 0 | 1,
      }
    } catch (error) {
      console.error(error)
      message.error('获取字典详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      dictName: '',
      dictCode: '',
      description: '',
      status: 1,
    }
  }
}

const close = () => {
  show.value = false
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        const payload = {
          ...formModel.value,
          status: formModel.value.status as 0 | 1,
        } as Dictionary
        if (isEdit.value) {
          await updateDictionary(payload)
          message.success('字典更新成功')
        } else {
          await createDictionary(payload)
          message.success('字典创建成功')
        }
        emit('success')
        close()
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

defineExpose({
  open,
  close,
})
</script>
