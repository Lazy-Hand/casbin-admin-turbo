import { useEffect, useMemo, useState } from 'react'
import { App, Button, Input, Modal, Space, Tabs } from 'antd'
import { ClockCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { CronFieldConfig, type CronFieldConfigValue } from '@/components/CronGenerator/CronFieldConfig'

type Props = {
  open: boolean
  value?: string
  onClose: () => void
  onConfirm: (value: string) => void
}

type CronFieldKey = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'

type CronConfigState = Record<CronFieldKey, CronFieldConfigValue>

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

function createPresetConfig(preset: string): CronConfigState {
  switch (preset) {
    case 'every-second':
      return {
        second: { type: 'every' },
        minute: { type: 'every' },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
    case 'every-minute':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'every' },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
    case 'every-hour':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'every' },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
    case 'every-day':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
    case 'every-week':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'unspec' },
        month: { type: 'every' },
        week: { type: 'specific', specific: [1] },
      }
    case 'every-month':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'specific', specific: [1] },
        month: { type: 'every' },
        week: { type: 'unspec' },
      }
    case 'every-year':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'specific', specific: [1] },
        month: { type: 'specific', specific: [1] },
        week: { type: 'unspec' },
      }
    case 'every-workday':
      return {
        second: { type: 'specific', specific: [0] },
        minute: { type: 'specific', specific: [0] },
        hour: { type: 'specific', specific: [0] },
        day: { type: 'every' },
        month: { type: 'every' },
        week: { type: 'specific', specific: [2, 3, 4, 5, 6] },
      }
    default:
      return createPresetConfig('every-minute')
  }
}

function fieldToCron(conf: CronFieldConfigValue) {
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

function buildCron(config: CronConfigState) {
  return [
    fieldToCron(config.second),
    fieldToCron(config.minute),
    fieldToCron(config.hour),
    fieldToCron(config.day),
    fieldToCron(config.month),
    fieldToCron(config.week),
  ].join(' ')
}

function parseField(value: string, min: number, max: number): CronFieldConfigValue {
  const trimmedValue = value.trim()

  if (trimmedValue === '?' || trimmedValue === '*') {
    return { type: 'every' }
  }

  const rangeMatch = trimmedValue.match(/^(\d+)-(\d+)$/)
  if (rangeMatch?.[1] && rangeMatch?.[2]) {
    const start = Number(rangeMatch[1])
    const end = Number(rangeMatch[2])
    if (start < min || end > max) {
      throw new Error(`范围超出有效值 ${min}-${max}`)
    }
    return { type: 'range', rangeStart: start, rangeEnd: end }
  }

  const loopMatch = trimmedValue.match(/^((\*\/\d+)|(\d+)\/(\d+))$/)
  if (loopMatch) {
    const fullMatch = loopMatch[1]
    if (fullMatch?.startsWith('*/')) {
      return { type: 'loop', loopStart: min, loopStep: Number(fullMatch.slice(2)) }
    }
    if (loopMatch[3] && loopMatch[4]) {
      return {
        type: 'loop',
        loopStart: Number(loopMatch[3]),
        loopStep: Number(loopMatch[4]),
      }
    }
  }

  const specific = trimmedValue.split(',').map((item) => Number(item.trim()))
  if (specific.some((item) => Number.isNaN(item) || item < min || item > max)) {
    throw new Error(`指定值超出有效范围 ${min}-${max}`)
  }
  return { type: 'specific', specific }
}

function parseCronToConfig(input: string): CronConfigState {
  const parts = input.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    throw new Error('Cron 表达式格式不正确，应为 5 或 6 位')
  }

  const secondPart = parts.length === 6 ? (parts[0] ?? '0') : '0'
  const minutePart = parts.length === 6 ? (parts[1] ?? '*') : (parts[0] ?? '*')
  const hourPart = parts.length === 6 ? (parts[2] ?? '*') : (parts[1] ?? '*')
  const dayPart = parts.length === 6 ? (parts[3] ?? '*') : (parts[2] ?? '*')
  const monthPart = parts.length === 6 ? (parts[4] ?? '*') : (parts[3] ?? '*')
  const weekPart = parts.length === 6 ? (parts[5] ?? '?') : (parts[4] ?? '?')

  return {
    second: parseField(secondPart, 0, 59),
    minute: parseField(minutePart, 0, 59),
    hour: parseField(hourPart, 0, 23),
    day: parseField(dayPart, 1, 31),
    month: parseField(monthPart, 1, 12),
    week: parseField(weekPart, 1, 7),
  }
}

function calculateNextRunTimes(cron: string) {
  try {
    const parts = cron.split(' ')
    if (parts.length < 5) {
      return []
    }

    const secondPart = parts[0] ?? '0'
    const minutePart = parts[1] ?? '0'
    const hourPart = parts[2] ?? '0'
    const now = new Date()
    let nextDate = new Date(now)
    const times: string[] = []

    for (let i = 0; i < 5; i += 1) {
      if (secondPart === '*' && minutePart === '*' && hourPart === '*') {
        nextDate = new Date(nextDate.getTime() + 1000)
      } else if (minutePart === '*' && hourPart === '*') {
        const second = Number(secondPart) || 0
        nextDate = new Date(nextDate)
        nextDate.setSeconds(second)
        nextDate.setMinutes(nextDate.getMinutes() + 1)
      } else if (hourPart === '*') {
        const minute = Number(minutePart) || 0
        const second = Number(secondPart) || 0
        nextDate = new Date(nextDate)
        nextDate.setSeconds(second)
        nextDate.setMinutes(minute)
        nextDate.setHours(nextDate.getHours() + 1)
      } else {
        const hourStr = hourPart.split(/[/-]/)[0]
        const hour = hourStr ? Number(hourStr) || 0 : 0
        const minute = Number(minutePart) || 0
        const second = Number(secondPart) || 0
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

    return times
  } catch {
    return []
  }
}

export function CronGenerator({ open, value, onClose, onConfirm }: Props) {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState<CronFieldKey>('second')
  const [currentPreset, setCurrentPreset] = useState('every-minute')
  const [config, setConfig] = useState<CronConfigState>(() => createPresetConfig('every-minute'))
  const generatedCron = useMemo(() => buildCron(config), [config])
  const nextRunTimes = useMemo(() => calculateNextRunTimes(generatedCron), [generatedCron])

  useEffect(() => {
    if (!open) {
      return
    }

    if (value?.trim()) {
      try {
        setConfig(parseCronToConfig(value))
        setCurrentPreset('')
        return
      } catch {
        setConfig(createPresetConfig('every-minute'))
        setCurrentPreset('every-minute')
        return
      }
    }

    setConfig(createPresetConfig('every-minute'))
    setCurrentPreset('every-minute')
  }, [open, value])

  return (
    <Modal
      open={open}
      width={760}
      title="Cron 表达式生成器"
      onCancel={onClose}
      onOk={() => onConfirm(generatedCron)}
      okText="确认"
      cancelText="取消"
      destroyOnHidden
      footer={(_, { OkBtn, CancelBtn }) => (
        <div className="flex items-center justify-between">
          <Button
            onClick={() => {
              try {
                const next = parseCronToConfig(generatedCron)
                setConfig(next)
                message.success('解析成功')
              } catch (error) {
                message.error(error instanceof Error ? error.message : '解析失败')
              }
            }}
          >
            反向解析表达式
          </Button>
          <Space>
            <CancelBtn />
            <OkBtn />
          </Space>
        </div>
      )}
    >
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium">快捷选择</div>
          <Space wrap>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                size="small"
                type={currentPreset === preset.value ? 'primary' : 'default'}
                onClick={() => {
                  setCurrentPreset(preset.value)
                  setConfig(createPresetConfig(preset.value))
                }}
              >
                {preset.label}
              </Button>
            ))}
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as CronFieldKey)}
          items={[
            {
              key: 'second',
              label: '秒',
              children: (
                <CronFieldConfig
                  value={config.second}
                  min={0}
                  max={59}
                  unit="秒"
                  onChange={(next) => setConfig((current) => ({ ...current, second: next }))}
                />
              ),
            },
            {
              key: 'minute',
              label: '分',
              children: (
                <CronFieldConfig
                  value={config.minute}
                  min={0}
                  max={59}
                  unit="分"
                  onChange={(next) => setConfig((current) => ({ ...current, minute: next }))}
                />
              ),
            },
            {
              key: 'hour',
              label: '时',
              children: (
                <CronFieldConfig
                  value={config.hour}
                  min={0}
                  max={23}
                  unit="时"
                  onChange={(next) => setConfig((current) => ({ ...current, hour: next }))}
                />
              ),
            },
            {
              key: 'day',
              label: '日',
              children: (
                <CronFieldConfig
                  value={config.day}
                  min={1}
                  max={31}
                  unit="日"
                  allowUnspec
                  onChange={(next) => setConfig((current) => ({ ...current, day: next }))}
                />
              ),
            },
            {
              key: 'month',
              label: '月',
              children: (
                <CronFieldConfig
                  value={config.month}
                  min={1}
                  max={12}
                  unit="月"
                  onChange={(next) => setConfig((current) => ({ ...current, month: next }))}
                />
              ),
            },
            {
              key: 'week',
              label: '周',
              children: (
                <CronFieldConfig
                  value={config.week}
                  min={1}
                  max={7}
                  unit="周"
                  allowUnspec
                  weekOptions={weekOptions}
                  onChange={(next) => setConfig((current) => ({ ...current, week: next }))}
                />
              ),
            },
          ]}
        />

        <div>
          <div className="mb-2 text-sm font-medium">Cron 表达式</div>
          <Input
            readOnly
            value={generatedCron}
            placeholder="生成结果"
            suffix={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  void navigator.clipboard.writeText(generatedCron)
                  message.success('已复制到剪贴板')
                }}
              />
            }
          />
          <div className="mt-1 text-xs text-slate-500">格式: 秒 分 时 日 月 周</div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">最近执行时间（近5次）</div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/40">
            {nextRunTimes.length ? (
              nextRunTimes.map((time) => (
                <div key={time} className="border-b border-slate-200 py-1 last:border-0">
                  {time}
                </div>
              ))
            ) : (
              <div className="text-slate-400">无法解析或未来无执行计划</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function CronGeneratorTriggerButton(props: { onClick: () => void }) {
  return <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={props.onClick} />
}
