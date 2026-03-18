import { Form, Input, InputNumber, Modal } from 'antd'
import type { DictionaryItem } from '@/api/dictionary'
import { DictRadio } from '@/components/dict/DictRadio'

type Props = {
  open: boolean
  initialValues?: Partial<DictionaryItem> | null
  onClose: () => void
  onSubmit: (values: Partial<DictionaryItem>) => Promise<void> | void
}

export function DictionaryItemDialog({ open, initialValues, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<Partial<DictionaryItem>>()

  return (
    <Modal
      open={open}
      forceRender
      title={initialValues?.id ? '修改字典项' : '新增字典项'}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then(async (values) => {
          await onSubmit(values)
          onClose()
        })
      }}
      okText="确认"
      cancelText="取消"
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue({
            label: '',
            value: '',
            colorType: '',
            sort: 0,
            status: 1,
            ...initialValues,
          })
        } else {
          form.resetFields()
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="标签" name="label" rules={[{ required: true, message: '请输入标签' }]}>
          <Input placeholder="输入标签" />
        </Form.Item>
        <Form.Item label="值" name="value" rules={[{ required: true, message: '请输入值' }]}>
          <Input placeholder="输入值" />
        </Form.Item>
        <Form.Item label="颜色类型" name="colorType">
          <Input placeholder="如 success / warning / error" />
        </Form.Item>
        <Form.Item label="排序" name="sort">
          <InputNumber style={{ width: '100%' }} placeholder="输入排序" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
