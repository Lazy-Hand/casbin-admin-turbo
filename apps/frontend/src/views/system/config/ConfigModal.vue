<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改配置' : '新增配置'"
    preset="card"
    class="w-full md:w-150!"
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
      <NFormItem label="配置键" path="configKey">
        <NInput v-model:value="formModel.configKey" placeholder="请输入配置键，如：site_name" />
      </NFormItem>

      <NFormItem label="配置值" path="configValue">
        <NInput v-model:value="formModel.configValue" placeholder="请输入配置值" />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="2"
        />
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
import { ref, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, type FormInst, type FormRules } from 'naive-ui'
import { createConfig, updateConfig, getConfigById, type Config } from '@/api/config'
import { useMessage } from 'naive-ui'
import DictRadio from '@/components/Dict/DictRadio.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)

const isEdit = computed(() => !!currentId.value)

const formModel = ref<Partial<Config>>({
  configKey: '',
  configValue: '',
  description: '',
  status: 1,
})

const rules: FormRules = {
  configKey: [{ required: true, message: '配置键不能为空', trigger: 'blur' }],
  configValue: [{ required: true, message: '配置值不能为空', trigger: 'blur' }],
}

const open = async (id?: number) => {
  currentId.value = id
  show.value = true

  if (id) {
    loading.value = true
    try {
      const res = await getConfigById(id)
      formModel.value = {
        id: res.data.id,
        configKey: res.data.configKey,
        configValue: res.data.configValue,
        description: res.data.description,
        status: Number(res.data.status) as 0 | 1,
      }
    } catch (error) {
      console.error(error)
      message.error('获取配置详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      configKey: '',
      configValue: '',
      description: '',
      status: 1,
    }
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (isEdit.value) {
          await updateConfig(formModel.value)
          message.success('配置更新成功')
        } else {
          await createConfig(formModel.value)
          message.success('配置创建成功')
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

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
})
</script>
