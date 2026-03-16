<template>
  <NModal
    :show="visible"
    preset="card"
    title="Cron 表达式生成器"
    class="cron-generator-modal w-full md:w-250!"
    @update:show="close"
  >
    <div class="space-y-4">
      <!-- 快捷选择 -->
      <div>
        <div class="text-sm font-medium mb-2">快捷选择</div>
        <NSpace wrap>
          <NButton
            v-for="preset in presets"
            :key="preset.value"
            :type="currentPreset === preset.value ? 'primary' : 'default'"
            size="small"
            @click="selectPreset(preset.value)"
          >
            {{ preset.label }}
          </NButton>
        </NSpace>
      </div>

      <!-- Tab 详细配置 -->
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- 秒 -->
        <NTabPane name="second" tab="秒">
          <CronFieldConfig
            v-model="config.second"
            :min="0"
            :max="59"
            unit="秒"
            @update="updateCron"
          />
        </NTabPane>

        <!-- 分 -->
        <NTabPane name="minute" tab="分">
          <CronFieldConfig
            v-model="config.minute"
            :min="0"
            :max="59"
            unit="分"
            @update="updateCron"
          />
        </NTabPane>

        <!-- 时 -->
        <NTabPane name="hour" tab="时">
          <CronFieldConfig
            v-model="config.hour"
            :min="0"
            :max="23"
            unit="时"
            @update="updateCron"
          />
        </NTabPane>

        <!-- 日 -->
        <NTabPane name="day" tab="日">
          <CronFieldConfig
            v-model="config.day"
            :min="1"
            :max="31"
            unit="日"
            :allow-unspec="true"
            @update="updateCron"
          />
        </NTabPane>

        <!-- 月 -->
        <NTabPane name="month" tab="月">
          <CronFieldConfig
            v-model="config.month"
            :min="1"
            :max="12"
            unit="月"
            @update="updateCron"
          />
        </NTabPane>

        <!-- 周 -->
        <NTabPane name="week" tab="周">
          <CronFieldConfig
            v-model="config.week"
            :min="1"
            :max="7"
            unit="周"
            :allow-unspec="true"
            :week-options="weekOptions"
            @update="updateCron"
          />
        </NTabPane>
      </NTabs>

      <!-- 生成结果 -->
      <div>
        <div class="text-sm font-medium mb-2">Cron 表达式</div>
        <div class="flex gap-2">
          <NInput v-model:value="generatedCron" placeholder="生成结果" readonly class="flex-1">
            <template #suffix>
              <NButton text size="small" @click="copyToClipboard">
                <template #icon>
                  <i class="pi pi-copy" />
                </template>
              </NButton>
            </template>
          </NInput>
        </div>
        <div class="text-xs text-gray-500 mt-1">格式: 秒 分 时 日 月 周</div>
      </div>

      <!-- 下次执行时间预览 -->
      <div>
        <div class="text-sm font-medium mb-2">最近执行时间（近5次）</div>
        <div class="text-sm bg-gray-50 dark:bg-gray-800 rounded p-3">
          <div v-if="nextRunTimes.length > 0">
            <div v-for="(time, idx) in nextRunTimes" :key="idx" class="py-1 border-b last:border-0">
              {{ time }}
            </div>
          </div>
          <div v-else class="text-gray-400">无法解析或未来无执行计划</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <NButton @click="reverseParse">反向解析表达式</NButton>
        <div class="flex gap-2">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" @click="handleConfirm">确认</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NButton, NSpace, NTabs, NTabPane, NInput, useMessage } from 'naive-ui'
import CronFieldConfig from './CronFieldConfig.vue'

defineProps<{
  visible: boolean
}>()

defineOptions({
  name: 'CronGenerator',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', value: string): void
}>()

const message = useMessage()
const activeTab = ref<'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'>('second')
const currentPreset = ref('')

const presets = [
  { label: '每秒', value: 'every-second' },
  { label: '每分钟', value: 'every-minute' },
  { label: '每小时', value: 'every-hour' },
  { label: '每天', value: 'every-day' },
  { label: '每周', value: 'every-week' },
  { label: '每月', value: 'every-month' },
  { label: '每年', value: 'every-year' },
  { label: '工作日(周一到周五)', value: 'every-workday' },
]

const weekOptions = [
  { label: '周日', value: '1' },
  { label: '周一', value: '2' },
  { label: '周二', value: '3' },
  { label: '周三', value: '4' },
  { label: '周四', value: '5' },
  { label: '周五', value: '6' },
  { label: '周六', value: '7' },
]

// 每个字段的配置
interface FieldConfig {
  type: 'every' | 'unspec' | 'range' | 'loop' | 'specific'
  rangeStart?: number
  rangeEnd?: number
  loopStart?: number
  loopStep?: number
  specific?: number[]
}

const config = ref<Record<string, FieldConfig>>({
  second: { type: 'every' },
  minute: { type: 'every' },
  hour: { type: 'every' },
  day: { type: 'every' },
  month: { type: 'every' },
  week: { type: 'unspec' },
})

const generatedCron = ref('')
const nextRunTimes = ref<string[]>([])

// 根据配置生成cron表达式字段值
const fieldToCron = (field: string, conf: FieldConfig): string => {
  switch (conf.type) {
    case 'every':
      return '*'
    case 'unspec':
      return '*'
    case 'range':
      return conf.rangeStart !== undefined && conf.rangeEnd !== undefined
        ? `${conf.rangeStart}-${conf.rangeEnd}`
        : '*'
    case 'loop':
      return conf.loopStart !== undefined && conf.loopStep !== undefined
        ? `${conf.loopStart}/${conf.loopStep}`
        : '*/1'
    case 'specific':
      return conf.specific && conf.specific.length > 0 ? conf.specific.join(',') : '*'
    default:
      return '*'
  }
}

// 生成完整的cron表达式
const buildCron = (): string => {
  const defaultConfig: FieldConfig = { type: 'every' }
  const second = fieldToCron('second', config.value.second ?? defaultConfig)
  const minute = fieldToCron('minute', config.value.minute ?? defaultConfig)
  const hour = fieldToCron('hour', config.value.hour ?? defaultConfig)
  const day = fieldToCron('day', config.value.day ?? defaultConfig)
  const month = fieldToCron('month', config.value.month ?? defaultConfig)
  const week = fieldToCron('week', config.value.week ?? defaultConfig)

  return `${second} ${minute} ${hour} ${day} ${month} ${week}`
}

const updateCron = () => {
  generatedCron.value = buildCron()
  calculateNextRunTimes()
}

// 计算下次执行时间（简化版本，准确的计算需要cron解析库）
const calculateNextRunTimes = () => {
  try {
    const times: string[] = []
    const cron = generatedCron.value
    const parts = cron.split(' ')

    if (parts.length < 5) {
      nextRunTimes.value = []
      return
    }

    // 解析各部分
    const secondPart = parts[0] ?? '0'
    const minutePart = parts[1] ?? '0'
    const hourPart = parts[2] ?? '0'
    // 简化的计算逻辑
    const now = new Date()
    let nextDate = new Date(now)

    for (let i = 0; i < 5; i++) {
      // 根据表达式计算下一次执行时间
      if (secondPart === '*' && minutePart === '*' && hourPart === '*') {
        // 每秒执行
        nextDate = new Date(nextDate.getTime() + 1000)
      } else if (minutePart === '*' && hourPart === '*') {
        // 每分钟固定秒数执行
        const second = parseInt(secondPart) || 0
        nextDate = new Date(nextDate)
        nextDate.setSeconds(second)
        nextDate.setMinutes(nextDate.getMinutes() + 1)
      } else if (hourPart === '*') {
        // 每小时固定分钟和秒数执行
        const minute = parseInt(minutePart) || 0
        const second = parseInt(secondPart) || 0
        nextDate = new Date(nextDate)
        nextDate.setSeconds(second)
        nextDate.setMinutes(minute)
        nextDate.setHours(nextDate.getHours() + 1)
      } else {
        // 每天固定时间执行
        const hourStr = hourPart.split(/[/-]/)[0]
        const hour = hourStr ? parseInt(hourStr) || 0 : 0
        const minute = parseInt(minutePart) || 0
        const second = parseInt(secondPart) || 0
        nextDate = new Date(nextDate)
        nextDate.setSeconds(second)
        nextDate.setMinutes(minute)
        nextDate.setHours(hour)
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
      }

      times.push(nextDate.toLocaleString('zh-CN'))
    }

    nextRunTimes.value = times
  } catch {
    nextRunTimes.value = []
  }
}

// 选择预设
const selectPreset = (preset: string) => {
  currentPreset.value = preset
  switch (preset) {
    case 'every-second':
      config.value = {
        second: { type: 'every' },
        minute: { type: 'every' },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
      break
    case 'every-minute':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'every' },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
      break
    case 'every-hour':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
      break
    case 'every-day':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
      break
    case 'every-week':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'unspec' },
        month: { type: 'every' },
        week: { type: 'specific', specific: [1] },
      }
      break
    case 'every-month':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'specific', specific: [1] },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
      break
    case 'every-year':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'specific', specific: [1] },
        month: { type: 'specific', specific: [1] },
        week: { type: 'unspec' },
      }
      break
    case 'every-workday':
      config.value = {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'specific', specific: [2, 3, 4, 5, 6] },
      }
      break
  }
  updateCron()
}

// 反向解析cron表达式
const reverseParse = () => {
  const input = generatedCron.value.trim()
  if (!input) {
    message.warning('请输入要解析的 cron 表达式')
    return
  }

  const parts = input.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    message.error('Cron 表达式格式不正确，应为 5 或 6 位')
    return
  }

  try {
    // 处理 5 位表达式（秒省略，默认为0）
    const secondPart = parts.length === 6 ? (parts[0] ?? '0') : '0'
    const minutePart = parts.length === 6 ? (parts[1] ?? '*') : (parts[0] ?? '*')
    const hourPart = parts.length === 6 ? (parts[2] ?? '*') : (parts[1] ?? '*')
    const dayPart = parts.length === 6 ? (parts[3] ?? '*') : (parts[2] ?? '*')
    const monthPart = parts.length === 6 ? (parts[4] ?? '*') : (parts[3] ?? '*')
    const weekPart = parts.length === 6 ? (parts[5] ?? '?') : (parts[4] ?? '?')

    // 解析每个字段
    config.value.second = parseField(secondPart, 0, 59)
    config.value.minute = parseField(minutePart, 0, 59)
    config.value.hour = parseField(hourPart, 0, 23)
    config.value.day = parseField(dayPart, 1, 31)
    config.value.month = parseField(monthPart, 1, 12)
    config.value.week = parseField(weekPart, 1, 7)

    updateCron()
    message.success('解析成功')
  } catch (e) {
    message.error('解析失败：' + (e as Error).message)
  }
}

// 解析单个字段
const parseField = (value: string, min: number, max: number): FieldConfig => {
  const trimmedValue = value.trim()

  if (trimmedValue === '?') {
    return { type: 'every' }
  }

  if (trimmedValue === '*') {
    return { type: 'every' }
  }

  // 解析范围 1-5
  const rangeMatch = trimmedValue.match(/^(\d+)-(\d+)$/)
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    if (start < min || end > max) throw new Error(`范围超出有效值 ${min}-${max}`)
    return { type: 'range', rangeStart: start, rangeEnd: end }
  }

  // 解析循环 */5 或 0/5
  const loopMatch = trimmedValue.match(/^((\*\/\d+)|(\d+)\/(\d+))$/)
  if (loopMatch) {
    const fullMatch = loopMatch[1]
    if (fullMatch?.startsWith('*/')) {
      const step = parseInt(fullMatch.substring(2))
      return { type: 'loop', loopStart: min, loopStep: step }
    } else if (loopMatch[3] && loopMatch[4]) {
      const start = parseInt(loopMatch[3])
      const step = parseInt(loopMatch[4])
      return { type: 'loop', loopStart: start, loopStep: step }
    }
  }

  // 解析指定值 1,2,3
  const specificValues = trimmedValue.split(',').map((v) => parseInt(v.trim()))
  if (specificValues.some((v) => isNaN(v) || v < min || v > max)) {
    throw new Error(`指定值超出有效范围 ${min}-${max}`)
  }
  return { type: 'specific', specific: specificValues }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedCron.value)
  message.success('已复制到剪贴板')
}

const handleConfirm = () => {
  emit('confirm', generatedCron.value)
  close()
}

const close = () => {
  emit('update:visible', false)
}

// 初始化
watch(
  () => generatedCron.value,
  () => {
    calculateNextRunTimes()
  },
  { immediate: true },
)

// 组件挂载时初始化
selectPreset('every-minute')
</script>

<style scoped>
.cron-generator-modal {
  width: 100%;
  max-width: 800px;
}

@media (min-width: 768px) {
  .cron-generator-modal {
    width: 700px;
  }
}
</style>
