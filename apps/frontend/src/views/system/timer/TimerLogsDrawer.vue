<template>
  <NDrawer :show="show" :width="800" placement="right" @update:show="handleShowUpdate">
    <NDrawerContent :title="`${currentTimerName || ''} - 执行日志`" closable>
      <!-- 过滤器 -->
      <NCard size="small" class="mb-4">
        <NSpace align="center">
          <span>状态:</span>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            size="small"
            style="width: 120px"
            clearable
            @update:value="handleRefresh"
          />
          <NButton size="small" type="primary" @click="handleRefresh">
            <template #icon>
              <AppIcon icon="antd:SearchOutlined" />
            </template>
            查询
          </NButton>
          <NButton size="small" @click="handleRefresh">
            <template #icon>
              <AppIcon icon="antd:ReloadOutlined" />
            </template>
            刷新
          </NButton>
        </NSpace>
      </NCard>

      <!-- 日志列表 -->
      <NSpin :show="loading">
        <NEmpty v-if="filteredLogs.length === 0 && !loading" description="暂无执行日志" />
        <div v-else class="logs-container">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="log-item"
            :class="{ 'log-item-success': log.status === 1, 'log-item-error': log.status === 0 }"
          >
            <div class="log-item-header">
              <NSpace align="center">
                <NTag :type="log.status === 1 ? 'success' : 'error'" size="small">
                  {{ log.status === 1 ? '成功' : '失败' }}
                </NTag>
                <span class="text-sm text-gray-600">
                  <AppIcon icon="antd:ClockCircleOutlined" class="mr-1" />
                  {{ formatTime(log.startAt) }}
                </span>
                <span v-if="log.duration" class="text-xs text-gray-500">
                  耗时: {{ formatDuration(log.duration) }}
                </span>
              </NSpace>
            </div>
            <div v-if="log.result" class="log-item-result">
              <NCode :code="log.result" language="json" :word-wrap="true" />
            </div>
          </div>
        </div>
      </NSpin>

      <template #footer>
        <div class="flex justify-between text-sm text-gray-500">
          <span>共 {{ filteredLogs.length }} 条记录</span>
          <span v-if="hasMoreLogs" class="text-blue-500 cursor-pointer" @click="loadMore">
            加载更多
          </span>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NCard,
  NSpace,
  NButton,
  NSelect,
  NSpin,
  NEmpty,
  NTag,
  NCode,
} from 'naive-ui'
import { getTimerLogs, type TimerExecutionLog } from '@/api/timer'

const show = ref(false)
const currentTimerId = ref<number>()
const currentTimerName = ref<string>()
const loading = ref(false)
const logs = ref<TimerExecutionLog[]>([])
const statusFilter = ref<number | null>(null)

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const filteredLogs = computed(() => {
  if (statusFilter.value === null) {
    return logs.value
  }
  return logs.value.filter((log) => log.status === statusFilter.value)
})

const hasMoreLogs = computed(() => {
  return logs.value.length >= 50
})

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatDuration = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else {
    const mins = Math.floor(ms / 60000)
    const secs = ((ms % 60000) / 1000).toFixed(0)
    return `${mins}m ${secs}s`
  }
}

const loadLogs = async () => {
  if (!currentTimerId.value) return

  loading.value = true
  try {
    const res = await getTimerLogs(currentTimerId.value, 100)
    logs.value = res.data || []
  } catch (error) {
    console.error('Failed to load logs:', error)
    logs.value = []
  } finally {
    loading.value = false
  }
}

const open = (timerId: number, timerName: string) => {
  currentTimerId.value = timerId
  currentTimerName.value = timerName
  show.value = true
  loadLogs()
}

const handleRefresh = () => {
  loadLogs()
}

const handleShowUpdate = (value: boolean) => {
  if (!value) {
    show.value = false
    currentTimerId.value = undefined
    currentTimerName.value = undefined
    statusFilter.value = null
    logs.value = []
  }
}

const loadMore = () => {
  // 后续可以实现分页加载更多
}

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
  loadLogs,
})
</script>

<style scoped>
.logs-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.log-item {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid;
  background-color: var(--n-color-modal);
  transition: all 0.2s;
}

.log-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-item-success {
  border-left-color: #52c41a;
}

.log-item-error {
  border-left-color: #ff4d4f;
}

.log-item-header {
  margin-bottom: 8px;
}

.log-item-result {
  margin-top: 8px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.dark .log-item-result {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
