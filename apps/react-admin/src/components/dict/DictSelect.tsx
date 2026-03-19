import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { useMemo } from 'react'
import { useDict } from '@/hooks/useDict'

export function DictSelect({
  dictCode,
  ...props
}: {
  dictCode: string
} & SelectProps) {
  const { items, loading } = useDict(dictCode)

  const options = useMemo(
    () =>
      items.map((item) => {
        const numValue = Number(item.value)
        const isNumeric = !Number.isNaN(numValue) && String(numValue) === item.value

        return {
          label: item.label,
          value: isNumeric ? numValue : item.value,
        }
      }),
    [items],
  )

  return <Select allowClear placeholder="请选择" loading={loading} options={options} {...props} />
}
