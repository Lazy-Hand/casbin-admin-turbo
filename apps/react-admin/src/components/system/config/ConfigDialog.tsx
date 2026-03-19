import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal } from 'antd'
import { createConfig, getConfigById, updateConfig, type Config } from '@/api/config'
import { DictRadio } from '@/components/dict/DictRadio'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  configId?: number | null
  onClose: () => void
}

export function ConfigDialog({ open, configId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<Partial<Config>>()
  const isEdit = Boolean(configId)

  const { data, isFetching } = useQuery({
    queryKey: ['config-detail', configId],
    queryFn: () => getConfigById(configId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        id: data.id,
        configKey: data.configKey,
        configValue: data.configValue,
        description: data.description || '',
        status: Number(data.status),
      })
      return
    }

    form.setFieldsValue({
      configKey: '',
      configValue: '',
      description: '',
      status: 1,
    })
  }, [data, form, isEdit, open])

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<Config>) => {
      if (isEdit) {
        return updateConfig({ ...values, id: configId! })
      }

      return createConfig(values)
    },
    onSuccess: async () => {
      message.success(isEdit ? '配置更新成功' : '配置创建成功')
      await queryClient.invalidateQueries({ queryKey: ['configs'] })
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改配置' : '新增配置'}
      okText="确认"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => saveMutation.mutate(values))
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" disabled={saveMutation.isPending || isFetching}>
        <Form.Item
          label="配置键"
          name="configKey"
          rules={[{ required: true, message: '请输入配置键' }]}
        >
          <Input placeholder="请输入配置键，如：site_name" />
        </Form.Item>
        <Form.Item
          label="配置值"
          name="configValue"
          rules={[{ required: true, message: '请输入配置值' }]}
        >
          <Input placeholder="请输入配置值" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} placeholder="请输入描述" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
