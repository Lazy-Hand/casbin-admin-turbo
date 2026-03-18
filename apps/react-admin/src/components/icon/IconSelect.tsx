import { MoreOutlined } from '@ant-design/icons'
import { Button, Input, Space } from 'antd'
import { useState } from 'react'
import { DynamicIcon } from '@/components/DynamicIcon'
import { IconPicker } from '@/components/icon/IconPicker'

type Props = {
  value?: string
  placeholder?: string
  onChange?: (value?: string) => void
}

export function IconSelect({
  value,
  placeholder = '点击选择图标',
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Input
        readOnly
        value={value}
        placeholder={placeholder}
        prefix={value ? <DynamicIcon icon={value} className="size-4" /> : null}
        suffix={(
          <Space size={4}>
            {value ? (
              <Button
                type="text"
                size="small"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onChange?.(undefined)
                }}
              >
                清除
              </Button>
            ) : null}
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setOpen(true)
              }}
            />
          </Space>
        )}
        onClick={() => setOpen(true)}
      />
      <IconPicker
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={(icon) => onChange?.(icon)}
      />
    </>
  )
}
