import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal } from 'antd'
import {
  createDictionary,
  getDictionary,
  updateDictionary,
  type Dictionary,
} from '@/api/dictionary'
import { DictRadio } from '@/components/dict/DictRadio'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  dictionaryId?: number | null
  onClose: () => void
}

export function DictionaryDialog({ open, dictionaryId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<Partial<Dictionary>>()
  const isEdit = Boolean(dictionaryId)

  const { data, isFetching } = useQuery({
    queryKey: ['dict-type-detail', dictionaryId],
    queryFn: () => getDictionary(dictionaryId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        ...data,
        status: Number(data.status),
      })
      return
    }

    form.setFieldsValue({
      dictName: '',
      dictCode: '',
      description: '',
      status: 1,
    })
  }, [data, form, isEdit, open])

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<Dictionary>) => {
      if (isEdit) {
        return updateDictionary({ ...values, id: dictionaryId! } as Partial<Dictionary> & {
          id: number
        })
      }

      return createDictionary(values)
    },
    onSuccess: async () => {
      message.success(isEdit ? '字典更新成功' : '字典创建成功')
      await queryClient.invalidateQueries({ queryKey: ['dict-types'] })
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改字典' : '新增字典'}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => saveMutation.mutate(values))
      }}
      okText="保存"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
    >
      <Form form={form} layout="vertical" disabled={saveMutation.isPending || isFetching}>
        <Form.Item
          label="字典名称"
          name="dictName"
          rules={[{ required: true, message: '请输入字典名称' }]}
        >
          <Input placeholder="输入字典名称" />
        </Form.Item>
        <Form.Item
          label="字典编码"
          name="dictCode"
          rules={[{ required: true, message: '请输入字典编码' }]}
        >
          <Input placeholder="输入字典编码" disabled={isEdit} />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} placeholder="输入描述" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
