import { Radio } from 'antd'
import type { RadioGroupProps } from 'antd'
import { useMemo } from 'react'
import { useDict } from '@/hooks/useDict'

export function DictRadio({
  dictCode,
  ...props
}: {
  dictCode: string
} & RadioGroupProps) {
  const { items } = useDict(dictCode)

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

  return <Radio.Group options={options} {...props} />
}
