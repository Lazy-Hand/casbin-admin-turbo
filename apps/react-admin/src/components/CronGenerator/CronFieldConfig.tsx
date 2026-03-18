import { Checkbox, InputNumber, Radio, Space } from 'antd'

export type CronFieldConfigValue = {
  type: 'every' | 'unspec' | 'range' | 'loop' | 'specific'
  rangeStart?: number
  rangeEnd?: number
  loopStart?: number
  loopStep?: number
  specific?: number[]
}

type Props = {
  value?: CronFieldConfigValue
  min: number
  max: number
  unit: string
  allowUnspec?: boolean
  weekOptions?: Array<{ label: string; value: string }>
  onChange: (value: CronFieldConfigValue) => void
}

export function CronFieldConfig({
  value = { type: 'every' },
  min,
  max,
  unit,
  allowUnspec = false,
  weekOptions,
  onChange,
}: Props) {
  const displayRange =
    max - min + 1 > 60
      ? Array.from({ length: 20 }, (_, index) => min + index)
      : Array.from({ length: max - min + 1 }, (_, index) => min + index)

  return (
    <div className="py-3">
      <Radio.Group
        size="small"
        value={value.type}
        onChange={(event) => {
          const nextType = event.target.value as CronFieldConfigValue['type']
          const nextValue: CronFieldConfigValue = { type: nextType }
          if (nextType === 'range') {
            nextValue.rangeStart = min
            nextValue.rangeEnd = min + 1
          } else if (nextType === 'loop') {
            nextValue.loopStart = min
            nextValue.loopStep = 1
          } else if (nextType === 'specific') {
            nextValue.specific = []
          }
          onChange(nextValue)
        }}
      >
        <Space direction="vertical">
          <Radio value="every">每一{unit}</Radio>
          {allowUnspec ? <Radio value="unspec">不指定</Radio> : null}
          <Radio value="range">周期</Radio>
          <Radio value="loop">从{unit}开始</Radio>
          <Radio value="specific">指定</Radio>
        </Space>
      </Radio.Group>

      {value.type === 'range' ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <Space align="center">
            <span>从</span>
            <InputNumber
              min={min}
              max={max}
              size="small"
              value={value.rangeStart ?? min}
              onChange={(next) => {
                onChange({
                  ...value,
                  rangeStart: next ?? min,
                })
              }}
            />
            <span>-</span>
            <InputNumber
              min={min}
              max={max}
              size="small"
              value={value.rangeEnd ?? min + 1}
              onChange={(next) => {
                onChange({
                  ...value,
                  rangeEnd: next ?? min + 1,
                })
              }}
            />
            <span>{unit}</span>
          </Space>
        </div>
      ) : null}

      {value.type === 'loop' ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <Space align="center" wrap>
            <span>从</span>
            <InputNumber
              min={min}
              max={max}
              size="small"
              value={value.loopStart ?? min}
              onChange={(next) => {
                onChange({
                  ...value,
                  loopStart: next ?? min,
                })
              }}
            />
            <span>{unit}开始，每</span>
            <InputNumber
              min={1}
              max={max}
              size="small"
              value={value.loopStep ?? 1}
              onChange={(next) => {
                onChange({
                  ...value,
                  loopStep: next ?? 1,
                })
              }}
            />
            <span>{unit}执行一次</span>
          </Space>
        </div>
      ) : null}

      {value.type === 'specific' ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-sm text-slate-600">请选择{unit}（可多选）：</div>
          <Checkbox.Group
            value={value.specific ?? []}
            onChange={(next) => {
              onChange({
                ...value,
                specific: next as number[],
              })
            }}
          >
            {unit === '周' && weekOptions ? (
              <Space wrap>
                {weekOptions.map((option) => (
                  <Checkbox key={option.value} value={Number(option.value)}>
                    {option.label}
                  </Checkbox>
                ))}
              </Space>
            ) : (
              <div className="grid grid-cols-5 gap-2 md:grid-cols-8">
                {displayRange.map((item) => (
                  <Checkbox key={item} value={item}>
                    {item}
                  </Checkbox>
                ))}
              </div>
            )}
          </Checkbox.Group>
        </div>
      ) : null}
    </div>
  )
}
