import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, InputNumber, Modal } from 'antd'
import { DictRadio } from '@/components/dict/DictRadio'
import { createPost, getPost, updatePost, type PostFormData } from '@/api/post'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  postId?: number | null
  onClose: () => void
}

export function PostDialog({ open, postId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<PostFormData>()
  const isEdit = Boolean(postId)

  const { data, isFetching } = useQuery({
    queryKey: ['post-detail', postId],
    queryFn: () => getPost(postId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        postName: data.postName,
        postCode: data.postCode,
        sort: data.sort,
        status: Number(data.status) as 0 | 1,
        remark: data.remark || '',
      })
      return
    }

    form.setFieldsValue({
      postName: '',
      postCode: '',
      sort: 0,
      status: 1,
      remark: '',
    })
  }, [data, form, isEdit, open])

  const saveMutation = useMutation({
    mutationFn: async (values: PostFormData) => {
      if (isEdit) {
        return updatePost(postId!, values)
      }
      return createPost(values)
    },
    onSuccess: async () => {
      message.success(isEdit ? '岗位更新成功' : '岗位创建成功')
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      onClose()
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改岗位' : '新增岗位'}
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
          label="岗位名称"
          name="postName"
          rules={[{ required: true, message: '请输入岗位名称' }]}
        >
          <Input placeholder="输入岗位名称" />
        </Form.Item>
        <Form.Item
          label="岗位编码"
          name="postCode"
          rules={[
            { required: true, message: '请输入岗位编码' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线' },
          ]}
        >
          <Input placeholder="输入岗位编码" />
        </Form.Item>
        <Form.Item label="排序" name="sort">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="输入排序" />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={3} placeholder="输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
