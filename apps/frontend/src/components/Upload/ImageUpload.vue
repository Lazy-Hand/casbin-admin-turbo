<script setup lang="ts">
import { ref, watch } from 'vue'
import { NUpload, useMessage } from 'naive-ui'
import type { UploadFileInfo, UploadCustomRequestOptions } from 'naive-ui'
import { uploadSingle } from '@/api/file'

import { useThemeVars } from 'naive-ui'
import { ImageOutline } from '@vicons/ionicons5'

interface Props {
  value?: any | any[] | null
  businessId?: number
  businessType?: string
  maxSize?: number // 单位: MB
  max?: number
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  maxSize: 5,
  max: 1,
  multiple: false,
})

const emit = defineEmits<{
  'update:value': [value: any | any[] | null]
}>()

const message = useMessage()
const themeVars = useThemeVars()

const fileList = ref<UploadFileInfo[]>([])
const fileRecordMap = new Map<string, any>()

watch(
  () => props.value,
  (newVal) => {
    const rawRecords = Array.isArray(newVal) ? newVal : newVal ? [newVal] : []
    // Only treat as valid records those that have a url (avoid empty object from v-model)
    const records = rawRecords.filter((r) => r && (r as { url?: string }).url)

    const localFinishedRecords = fileList.value
      .filter((f) => f.status === 'finished' && (f as any).record)
      .map((f) => (f as any).record)

    if (
      records.length === localFinishedRecords.length &&
      records.every((r, i) => r.url === localFinishedRecords[i]?.url)
    ) {
      return
    }

    const nonFinished = fileList.value.filter((f) => f.status !== 'finished')
    const regeneratedFinished = records.map((record, index) => {
      const url = (record as { url?: string }).url
      const existing = fileList.value.find((f) => f.status === 'finished' && f.url === url)
      if (existing) {
        fileRecordMap.set(existing.id, record)
        return existing
      }

      const fileId = `img-v-${(record as { id?: number }).id ?? Date.now()}-${index}`
      fileRecordMap.set(fileId, record)

      return {
        id: fileId,
        name:
          (record as { originalName?: string }).originalName ||
          (record as { filename?: string }).filename ||
          (url ? url.split('/').pop() : null) ||
          `image-${index}`,
        status: 'finished',
        url,
        record: record,
      } as UploadFileInfo & { record?: any }
    })

    fileList.value = [...regeneratedFinished, ...nonFinished]
  },
  { immediate: true },
)

// 更新 v-model
const updateValue = (list: UploadFileInfo[]) => {
  const finishedRecords = list
    .filter((f) => f.status === 'finished')
    .map((f) => fileRecordMap.get(f.id) || { url: f.url })

  if (props.max === 1 && !props.multiple) {
    emit('update:value', finishedRecords.length > 0 ? finishedRecords[0] || null : null)
  } else {
    emit('update:value', finishedRecords)
  }
}

// 拦截上传，检查大小
const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const file = data.file.file
  if (!file) return false

  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }

  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    message.error(`图片大小不能超过 ${props.maxSize}MB！`)
    return false
  }

  return true
}

// 自定义上传实现
const customRequest = async ({
  file,
  onFinish,
  onError,
  onProgress,
}: UploadCustomRequestOptions) => {
  if (!file.file) {
    onError()
    return
  }

  try {
    const res = await uploadSingle(
      file.file,
      {
        businessId: props.businessId,
        businessType: props.businessType,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress({ percent })
        }
      },
    )
    // 统一处理返回数据，适配 { code, data, message, success } 格式
    const resData = res as any
    const record = resData.data || resData
    file.url = record.url || res
    fileRecordMap.set(file.id, record)
    onFinish()
  } catch (error: any) {
    message.error(error.message || '上传失败')
    onError()
  }
}

const handleRemove = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const list = data.fileList.filter((f) => f.id !== data.file.id)
  fileList.value = list
  updateValue(list)
  return true
}

const handleChange = (list: UploadFileInfo[]) => {
  fileList.value = list
  updateValue(list)
}
</script>

<template>
  <div
    class="custom-image-upload border p-1 rounded inline-block max-w-full"
    :style="{
      borderColor: themeVars.borderColor,
      backgroundColor: themeVars.cardColor,
      transition: 'border-color 0.3s, background-color 0.3s',
    }"
  >
    <div
      class="drag-area border-2 border-dashed p-4 relative transition-colors duration-300 min-h-30 min-w-30"
      :class="{
        'is-error': fileList.some((f) => f.status === 'error'),
        'flex items-center justify-center': fileList.length === 0,
        'block text-left': fileList.length > 0,
      }"
    >
      <n-upload
        accept="image/*"
        list-type="image-card"
        :max="max"
        :multiple="multiple"
        :file-list="fileList"
        @before-upload="beforeUpload"
        @update:file-list="handleChange"
        @remove="handleRemove"
        :custom-request="customRequest"
        v-bind="$attrs"
        class="h-full w-full"
        :class="{ 'flex items-center justify-center': fileList.length === 0 }"
      >
        <template #default>
          <div
            class="flex flex-col items-center justify-center text-gray-400 gap-1 w-24 h-24 p-2 hover:text-primary transition-colors cursor-pointer self-start"
          >
            <n-icon size="28" :color="themeVars.primaryColor">
              <ImageOutline />
            </n-icon>
            <span class="text-xs">点击/拖拽上传</span>
          </div>
        </template>
      </n-upload>
    </div>
    <div
      v-if="fileList.length === 0"
      class="w-full text-center text-gray-400 text-xs mt-2 px-2 pb-1"
    >
      请上传图片, 单张大小在{{ maxSize }}M以内
    </div>
  </div>
</template>

<style scoped>
.custom-image-upload {
  --primary-color: v-bind('themeVars.primaryColor');
  --primary-color-hover: v-bind('themeVars.primaryColorHover');
  --error-color: v-bind('themeVars.errorColor');
}

.drag-area {
  border-color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.drag-area.is-error {
  border-color: var(--error-color);
  background-color: color-mix(in srgb, var(--error-color) 10%, transparent);
}

.text-primary {
  color: var(--primary-color);
  transition: color 0.3s;
}

/* 覆盖 Naive UI 内部样式 */
:deep(.n-upload-trigger.n-upload-trigger--image-card) {
  border: none;
  background-color: transparent;
  width: 100px;
  height: 100px;
}

/* 强制文件列表横向包裹布局 */
:deep(.n-upload-file-list) {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  padding: 0 !important;
  justify-content: inherit !important;
  align-items: inherit !important;
}

/* 如果内容物超过外层，触发换行并适应内容大小 */
:deep(.n-upload-file-list > div) {
  margin: 0 !important;
  /* 覆盖 naive-ui 可能存在的内置 margin */
}
</style>
