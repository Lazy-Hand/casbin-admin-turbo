<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改定时任务' : '创建定时任务'"
    preset="card"
    class="w-full md:w-250!"
    @update:show="close"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="120"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="定时任务名称" path="name">
        <NInput v-model:value="formModel.name" placeholder="请输入定时任务名称" />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="2"
        />
      </NFormItem>

      <NFormItem label="Cron 表达式" path="cron">
        <NInput
          v-model:value="formModel.cron"
          placeholder="如: 0 0 * * * * 表示每小时整点"
          class="flex-1"
        >
          <template #suffix>
            <NButton text size="small" @click="openCronGenerator">
              <template #icon>
                <AppIcon icon="antd:ClockCircleOutlined" />
              </template>
            </NButton>
          </template>
        </NInput>
        <template #feedback>
          <span class="text-xs text-gray-500">
            支持 6 位(秒 分 时 日 月 周) 或 5 位(分 时 日 月 周) 格式
          </span>
        </template>
      </NFormItem>

      <NFormItem label="任务类型" path="taskType">
        <DictSelect
          dict-code="TASK_TYPE"
          v-model:value="formModel.taskType"
          class="w-48!"
          placeholder="请选择"
        />
      </NFormItem>

      <NFormItem label="目标地址" path="target">
        <NInput
          v-model:value="formModel.target"
          :placeholder="formModel.taskType === 'HTTP' ? '请输入 URL' : '请输入脚本路径'"
        />
      </NFormItem>

      <NFormItem label="额外参数" path="params">
        <NInput
          v-model:value="paramsJson"
          type="textarea"
          placeholder='{"method": "POST", "headers": {}}'
          :rows="4"
        />
        <template #feedback>
          <span class="text-xs text-gray-500">
            JSON 格式，HTTP 请求可配置 method、headers、body 等
          </span>
        </template>
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictSelect v-model:value="formModel.status" dict-code="BASE_STATUS" />
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSave">确认</NButton>
      </div>
    </template>

    <CronGenerator v-model:visible="cronGeneratorVisible" @confirm="handleCronConfirm" />
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, type FormInst, type FormRules } from 'naive-ui'
import { createTimer, updateTimer, getTimer, type TimerParams, TaskType } from '@/api/timer'
import { useMessage } from 'naive-ui'
import CronGenerator from '@/components/CronGenerator/index.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)
const paramsJson = ref('')
const cronGeneratorVisible = ref(false)
const isEdit = computed(() => !!currentId.value)

const formModel = ref<TimerParams>({
  name: '',
  description: '',
  cron: '',
  taskType: TaskType.HTTP,
  target: '',
  params: undefined,
  status: 1,
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '定时任务名称不能为空', trigger: 'blur' }],
  cron: [{ required: true, message: 'Cron 表达式不能为空', trigger: 'blur' }],
  taskType: [{ required: true, message: '任务类型不能为空', trigger: 'change' }],
  target: [{ required: true, message: '目标地址不能为空', trigger: 'blur' }],
}))

const open = async (id?: number) => {
  currentId.value = id
  show.value = true

  if (id) {
    loading.value = true
    try {
      const res = await getTimer(id)
      const data = res.data
      formModel.value = {
        name: data.name,
        description: data.description || '',
        cron: data.cron,
        taskType: data.taskType,
        target: data.target,
        params: data.params || undefined,
        status: data.status,
      }
      paramsJson.value = data.params ? JSON.stringify(data.params, null, 2) : ''
    } catch (error) {
      console.error(error)
      message.error('获取定时任务详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      name: '',
      description: '',
      cron: '',
      taskType: TaskType.HTTP,
      target: '',
      params: undefined,
      status: 1,
    }
    paramsJson.value = ''
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      let params: Record<string, unknown> | undefined
      if (paramsJson.value.trim()) {
        try {
          params = JSON.parse(paramsJson.value)
        } catch {
          message.error('额外参数格式错误，请输入有效的 JSON')
          return
        }
      }

      loading.value = true
      try {
        const payload = { ...formModel.value, params }
        if (isEdit.value) {
          await updateTimer(currentId.value!, payload)
          message.success('更新成功')
        } else {
          await createTimer(payload)
          message.success('创建成功')
        }
        emit('success')
        close()
      } catch (error) {
        console.error(error)
        message.error(isEdit.value ? '更新失败' : '创建失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const openCronGenerator = () => {
  cronGeneratorVisible.value = true
}

const handleCronConfirm = (cron: string) => {
  formModel.value.cron = cron
  cronGeneratorVisible.value = false
}

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
})
</script>
