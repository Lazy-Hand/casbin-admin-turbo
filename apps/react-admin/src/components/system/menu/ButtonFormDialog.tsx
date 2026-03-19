import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal } from 'antd'
import { DictRadio } from '@/components/dict/DictRadio'
import { createMenu, getMenu, updateMenu } from '@/api/menu'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  menuId: number
  buttonId?: number | null
  onClose: () => void
}

type ButtonFormValues = {
  permName: string
  permCode: string
  status: 0 | 1
}

export function ButtonFormDialog({ open, menuId, buttonId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<ButtonFormValues>()
  const isEdit = Boolean(buttonId)

  const { data, isFetching } = useQuery({
    queryKey: ['menu-button-detail', buttonId],
    queryFn: () => getMenu(buttonId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        permName: data.permName || '',
        permCode: data.permCode || '',
        status: (data.status as 0 | 1) ?? 1,
      })
      return
    }

    form.setFieldsValue({
      permName: '',
      permCode: '',
      status: 1,
    })
  }, [data, form, isEdit, open])

  const saveMutation = useMutation({
    mutationFn: async (values: ButtonFormValues) => {
      const payload = {
        permName: values.permName,
        permCode: values.permCode,
        status: values.status,
        resourceType: 'button' as const,
      }

      if (isEdit) {
        return updateMenu(buttonId!, payload)
      }

      return createMenu({
        ...payload,
        parentId: menuId,
      })
    },
    onSuccess: async () => {
      message.success(isEdit ? '按钮修改成功' : '按钮新增成功')
      await queryClient.invalidateQueries({ queryKey: ['menu-buttons', menuId] })
      await queryClient.invalidateQueries({ queryKey: ['menus'] })
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改按钮' : '新增按钮'}
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
          label="按钮名称"
          name="permName"
          rules={[{ required: true, message: '请输入按钮名称' }]}
        >
          <Input placeholder="输入按钮名称" />
        </Form.Item>
        <Form.Item
          label="按钮编码"
          name="permCode"
          rules={[{ required: true, message: '请输入按钮编码' }]}
        >
          <Input placeholder="输入按钮编码" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
