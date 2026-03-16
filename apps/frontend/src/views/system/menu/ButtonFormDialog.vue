<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改按钮' : '新增按钮'"
    preset="card"
    class="w-full md:w-140!"
    @update:show="close"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="90"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="按钮名称" path="permName">
        <NInput v-model:value="formModel.permName" placeholder="输入按钮名称" />
      </NFormItem>

      <NFormItem label="按钮编码" path="permCode">
        <NInput v-model:value="formModel.permCode" placeholder="输入按钮编码" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictRadio dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSave">确认</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, useMessage, type FormInst, type FormRules } from 'naive-ui'
import { createMenu, getMenu, updateMenu } from '@/api/menu'
import DictRadio from '@/components/Dict/DictRadio.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const show = ref(false)
const loading = ref(false)
const currentId = ref<number>()
const parentId = ref<number>()
const formRef = ref<FormInst | null>(null)

const formModel = ref({
  permName: '',
  permCode: '',
  status: 1 as 0 | 1,
})

const isEdit = computed(() => !!currentId.value)

const rules: FormRules = {
  permName: [{ required: true, message: '按钮名称不能为空', trigger: 'blur' }],
  permCode: [{ required: true, message: '按钮编码不能为空', trigger: 'blur' }],
  status: [{ type: 'number', required: true, message: '请选择状态', trigger: 'change' }],
}

const open = async (menuId: number, id?: number) => {
  parentId.value = menuId
  currentId.value = id
  show.value = true

  if (id) {
    loading.value = true
    try {
      const res = await getMenu(id)
      formModel.value = {
        permName: res.data.permName || '',
        permCode: res.data.permCode || '',
        status: (res.data.status as 0 | 1) ?? 1,
      }
    } catch (error) {
      console.error(error)
      message.error('获取按钮详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      permName: '',
      permCode: '',
      status: 1,
    }
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return

    loading.value = true
    try {
      const payload = {
        permName: formModel.value.permName,
        permCode: formModel.value.permCode,
        status: formModel.value.status,
        resourceType: 'button' as const,
      }

      if (isEdit.value) {
        await updateMenu(currentId.value!, payload)
        message.success('按钮修改成功')
      } else {
        await createMenu({
          ...payload,
          parentId: parentId.value,
        })
        message.success('按钮新增成功')
      }

      emit('success')
      close()
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
})
</script>
