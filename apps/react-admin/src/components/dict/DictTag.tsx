import { Tag } from 'antd'
import { useDict } from '@/hooks/useDict'

const fallbackColorMap: Record<string, string> = {
  default: 'default',
  primary: 'processing',
  info: 'processing',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

export function DictTag({
  value,
  dictCode,
}: {
  value: string | number | null | undefined
  dictCode: string
}) {
  const { items } = useDict(dictCode)
  const item = items.find((entry) => entry.value == String(value))

  if (!item) {
    return <span>{value ?? '-'}</span>
  }

  return <Tag color={fallbackColorMap[item.colorType] ?? 'processing'}>{item.label}</Tag>
}
