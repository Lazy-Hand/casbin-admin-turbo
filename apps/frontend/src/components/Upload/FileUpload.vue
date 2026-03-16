<script setup lang="ts">
import { ref, watch } from 'vue'
import { NUpload, NUploadDragger, NIcon, useMessage, NSpin, useThemeVars } from 'naive-ui'
import { DocumentTextOutline, CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5'
import type { UploadFileInfo, UploadCustomRequestOptions } from 'naive-ui'
import { uploadSingle } from '@/api/file'
import { useChunkUpload } from '@/composables/useChunkUpload'
import dayjs from 'dayjs'

interface Props {
  value?: Record<string, any> | Record<string, any>[] | null
  businessId?: number
  businessType?: string
  accept?: string
  maxSize?: number // 单位: MB
  chunkSize?: number // 单位: MB (默认5MB)
  max?: number
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  maxSize: 100, // 默认 100M
  chunkSize: 5,
  max: 1,
  multiple: false,
})

const emit = defineEmits<{
  'update:value': [value: Record<string, any> | Record<string, any>[] | null]
}>()

const message = useMessage()
const themeVars = useThemeVars()
const { uploadFileChunks } = useChunkUpload({
  chunkSize: props.chunkSize * 1024 * 1024,
  concurrentCount: 3,
})
const uploadRef = ref<InstanceType<typeof NUpload> | null>(null)

const fileList = ref<UploadFileInfo[]>([])
const fileRecordMap = new Map<string, any>()

watch(
  () => props.value,
  (newVal) => {
    const records = Array.isArray(newVal) ? newVal : newVal ? [newVal] : []

    const localFinishedRecords = fileList.value
      .filter((f) => f.status === 'finished' && (f as any).record)
      .map((f) => (f as any).record)

    // 简单对比长度和对象的 url 是否一致
    if (
      records.length === localFinishedRecords.length &&
      records.every((r, i) => r.url === localFinishedRecords[i].url)
    ) {
      return
    }

    const nonFinished = fileList.value.filter((f) => f.status !== 'finished')
    const regeneratedFinished = records.map((record, index) => {
      const existing = fileList.value.find((f) => f.status === 'finished' && f.url === record.url)
      if (existing) {
        fileRecordMap.set(existing.id, record)
        return existing
      }

      const fileId = `file-v-${record.id || Date.now()}-${index}`
      fileRecordMap.set(fileId, record)

      return {
        id: fileId,
        name:
          record.originalName || record.filename || record.url.split('/').pop() || `file-${index}`,
        status: 'finished',
        url: record.url,
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
    .map((f) => fileRecordMap.get(f.id) || { url: f.url }) // 保底处理

  if (props.max === 1 && !props.multiple) {
    emit('update:value', finishedRecords.length > 0 ? finishedRecords[0] || null : null)
  } else {
    emit('update:value', finishedRecords)
  }
}

// 拦截上传，检查大小和格式
const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const file = data.file.file
  if (!file) return false

  if (props.accept) {
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const allowedExtensions = props.accept.split(',').map((item) => item.trim().toLowerCase())
    const hasAllowedExtension = allowedExtensions.some(
      (ext) =>
        ext === fileExtension ||
        ext === '.*' ||
        (ext.indexOf('/') > -1 && file.type.match(ext.replace('*', '.*'))),
    )
    if (!hasAllowedExtension) {
      message.error(`不支持该文件格式，仅支持: ${props.accept}`)
      return false
    }
  }

  const isLtMaxSize = file.size / 1024 / 1024 <= props.maxSize
  if (!isLtMaxSize) {
    message.error(`文件大小不能超过 ${props.maxSize}MB！`)
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
  const realFile = file.file

  try {
    let finalUrl: any = ''

    // 如果大于阈值，则使用分片上传
    if (realFile.size > props.chunkSize * 1024 * 1024) {
      finalUrl = await uploadFileChunks(
        realFile,
        props.businessId,
        props.businessType,
        (percent) => {
          onProgress({ percent })
        },
      )
    } else {
      // 否则走普通单文件上传
      finalUrl = await uploadSingle(
        realFile,
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
    }
    // 统一处理返回数据，适配 { code, data, message, success } 格式
    const resData = finalUrl as any
    const record = resData.data || resData
    file.url = record.url || finalUrl
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

const formatSize = (bytes: number | null | undefined) => {
  if (!bytes) return '0K'
  const k = 1024
  if (bytes < k) return bytes + 'B'
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unit = ['B', 'K', 'M', 'G', 'T'][i] || 'T'
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + unit
}

const formatDate = (timestamp?: number | null) => {
  if (!timestamp) return ''
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <div
    class="custom-file-upload border p-1 rounded max-w-2xl"
    :style="{
      borderColor: themeVars.borderColor,
      backgroundColor: themeVars.cardColor,
      transition: 'border-color 0.3s, background-color 0.3s',
    }"
  >
    <div
      class="drag-area border-2 border-dashed p-4 text-center flex items-center justify-center relative transition-colors duration-300"
      :class="{
        'is-error': fileList.some((f) => f.status === 'error'),
        'min-h-30': multiple || fileList.length === 0,
      }"
    >
      <!-- 拖拽上传区域 (多文件始终可见，单文件在没有文件时可见) -->
      <n-upload
        ref="uploadRef"
        v-show="multiple || fileList.length === 0"
        :accept="accept"
        :max="max"
        :multiple="multiple"
        :show-file-list="false"
        :file-list="fileList"
        @before-upload="beforeUpload"
        @update:file-list="handleChange"
        @remove="handleRemove"
        :custom-request="customRequest"
        v-bind="$attrs"
        class="w-full h-full [&>.n-upload-trigger]:h-full [&>.n-upload-trigger]:w-full"
      >
        <n-upload-dragger
          class="h-full w-full flex flex-col justify-center items-center bg-transparent border-none py-6"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-primary font-medium">点击上传</span>
            <span class="text-gray-400">/ 拖拽到此区域</span>
          </div>
          <div class="text-gray-400 text-sm">请上传文件, 大小在{{ maxSize }}M以内</div>
        </n-upload-dragger>
      </n-upload>

      <!-- 单文件显示区域 (完全取代拖拽区) -->
      <div
        v-if="!multiple && fileList.length > 0"
        class="w-full flex items-start gap-4 p-4"
        :style="{ backgroundColor: themeVars.cardColor }"
      >
        <!-- 默认使用文档图标 -->
        <n-icon size="40" :color="themeVars.primaryColor" class="mt-1 shrink-0">
          <DocumentTextOutline />
        </n-icon>

        <div class="flex-1 text-left min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span :style="{ color: themeVars.textColorBase }" :title="fileList[0]?.name">{{
              fileList[0]?.name
            }}</span>

            <!-- 状态图标与进度 -->
            <template v-if="fileList[0]?.status === 'uploading'">
              <n-spin size="small" />
              <span class="text-primary ml-1">{{ fileList[0]?.percentage || 0 }}%</span>
            </template>
            <template v-else-if="fileList[0]?.status === 'finished'">
              <n-icon size="20" color="#10b981" class="shrink-0">
                <CheckmarkCircleOutline />
              </n-icon>
            </template>
            <template v-else-if="fileList[0]?.status === 'error'">
              <n-icon size="20" color="#ef4444" class="shrink-0">
                <CloseCircleOutline />
              </n-icon>
            </template>
          </div>

          <div class="text-gray-400 text-sm space-y-1 mb-4 flex gap-4">
            <div v-if="fileList[0]?.file?.size">
              大小: {{ formatSize(fileList[0]?.file?.size || 0) }}
            </div>
            <div v-if="fileList[0]?.file?.lastModified">
              日期: {{ formatDate(fileList[0]?.file?.lastModified) }}
            </div>
          </div>

          <div class="flex gap-4">
            <template v-if="fileList[0]?.status === 'uploading'">
              <span
                class="text-primary cursor-pointer hover-text-primary-hover"
                @click="handleRemove({ file: fileList[0]!, fileList })"
                >取消上传</span
              >
            </template>
            <template v-else>
              <!-- Use a different ref for inner upload to avoid overwriting outer uploadRef -->
              <div class="flex items-center gap-4">
                <n-upload
                  ref="reuploadRef"
                  :accept="accept"
                  :max="1"
                  :multiple="false"
                  :show-file-list="false"
                  @before-upload="
                    (data) => {
                      fileList = [] // Clear current list visually immediately
                      return beforeUpload(data)
                    }
                  "
                  @update:file-list="handleChange"
                  @remove="handleRemove"
                  :custom-request="customRequest"
                  v-bind="$attrs"
                  class="inline-flex w-max shrink-0"
                >
                  <span
                    class="text-primary cursor-pointer hover-text-primary-hover whitespace-nowrap shrink-0"
                    >重新上传</span
                  >
                </n-upload>
                <span
                  class="text-primary cursor-pointer hover-text-primary-hover whitespace-nowrap shrink-0"
                  @click="handleRemove({ file: fileList[0]!, fileList })"
                  >删除</span
                >
              </div>
            </template>
          </div>

          <div
            v-if="fileList[0]?.status === 'error'"
            class="mt-4 text-left text-red-500 text-sm w-full"
          >
            网络异常或上传失败
          </div>
        </div>
      </div>
    </div>

    <!-- Custom File Display (When multiple files exist) -->
    <div v-if="multiple && fileList.length > 0" class="mt-4 px-2 pb-2 space-y-3">
      <div
        v-for="fileItem in fileList"
        :key="fileItem.id"
        class="w-full flex items-start gap-4 p-3 border rounded"
        :style="{
          borderColor: themeVars.borderColor,
          backgroundColor: themeVars.cardColor,
        }"
      >
        <!-- 默认使用文档图标 -->
        <n-icon size="36" :color="themeVars.primaryColor" class="mt-1 shrink-0">
          <DocumentTextOutline />
        </n-icon>

        <div class="flex-1 text-left min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-gray-700 text-sm truncate" :title="fileItem.name">{{
              fileItem.name
            }}</span>

            <!-- 状态图标与进度 -->
            <template v-if="fileItem.status === 'uploading'">
              <n-spin size="small" />
              <span class="text-primary ml-1 text-xs">{{ fileItem.percentage || 0 }}%</span>
            </template>
            <template v-else-if="fileItem.status === 'finished'">
              <n-icon size="18" color="#10b981" class="shrink-0">
                <CheckmarkCircleOutline />
              </n-icon>
            </template>
            <template v-else-if="fileItem.status === 'error'">
              <n-icon size="18" color="#ef4444" class="shrink-0">
                <CloseCircleOutline />
              </n-icon>
            </template>
          </div>

          <div class="text-gray-400 text-xs flex gap-4 mb-2">
            <span v-if="fileItem.file?.size">大小: {{ formatSize(fileItem.file?.size || 0) }}</span>
            <span v-if="fileItem.file?.lastModified"
              >日期: {{ formatDate(fileItem.file?.lastModified) }}</span
            >
          </div>

          <div class="flex gap-4 text-xs">
            <template v-if="fileItem.status === 'uploading'">
              <span
                class="text-primary cursor-pointer hover-text-primary-hover"
                @click="handleRemove({ file: fileItem, fileList })"
                >取消上传</span
              >
            </template>
            <template v-else>
              <!-- 对于异常失败的，允许单个重试（通过触发整体重新上传的逻辑的话，实际上不如先删再选） -->
              <span
                class="text-primary cursor-pointer hover-text-primary-hover"
                @click="handleRemove({ file: fileItem, fileList })"
                >删除</span
              >
            </template>
          </div>

          <div
            v-if="fileItem.status === 'error'"
            class="mt-2 text-left text-red-500 text-xs w-full"
          >
            网络异常或上传失败
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-file-upload {
  --primary-color: v-bind('themeVars.primaryColor');
  --primary-color-hover: v-bind('themeVars.primaryColorHover');
  --error-color: v-bind('themeVars.errorColor');
}

.custom-file-upload .n-upload-dragger {
  /* background-color: transparent !important; */
  border: none !important;
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

.hover-text-primary-hover:hover {
  color: var(--primary-color-hover);
}
</style>
