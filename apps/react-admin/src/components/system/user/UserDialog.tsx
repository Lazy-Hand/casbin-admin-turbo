import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal, Select, TreeSelect } from 'antd'
import type { TreeSelectProps } from 'antd'
import { createUser, getUser, updateUser, type UserFormData } from '@/api/user'
import { getDeptTree, type Dept } from '@/api/dept'
import { getPostOptions } from '@/api/post'
import { getRoleOptions } from '@/api/role'
import { DictSelect } from '@/components/dict/DictSelect'
import { ImageUpload } from '@/components/upload'
import { queryClient } from '@/lib/query-client'

type UserDialogProps = {
  open: boolean
  userId?: number | null
  onClose: () => void
}

type UserFormValues = UserFormData

function mapDeptTree(nodes: Dept[]): TreeSelectProps['treeData'] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children?.length ? mapDeptTree(node.children) : undefined,
  }))
}

export function UserDialog({ open, userId, onClose }: UserDialogProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<UserFormValues>()
  const isEdit = Boolean(userId)

  const { data: roleOptions = [] } = useQuery({
    queryKey: ['role-options'],
    queryFn: getRoleOptions,
    enabled: open,
  })

  const { data: postOptions = [] } = useQuery({
    queryKey: ['post-options'],
    queryFn: getPostOptions,
    enabled: open,
  })

  const { data: deptTree = [] } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDeptTree,
    enabled: open,
  })

  const { data: userDetail, isFetching: isFetchingDetail } = useQuery({
    queryKey: ['system-user-detail', userId],
    queryFn: () => getUser(userId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (!isEdit) {
      form.setFieldsValue({
        username: '',
        nickname: '',
        password: '',
        email: '',
        mobile: '',
        status: 1,
        roles: [],
        deptId: null,
        postId: null,
        avatar: '',
      })
      return
    }

    if (!userDetail) {
      return
    }

    form.setFieldsValue({
      username: userDetail.username,
      nickname: userDetail.nickname,
      password: '',
      email: userDetail.email,
      mobile: userDetail.mobile,
      status: userDetail.status,
      roles: userDetail.roles?.map((item) => item.id) ?? [],
      deptId: userDetail.deptId ?? null,
      postId: userDetail.postId ?? null,
      avatar: userDetail.avatar ?? '',
    })
  }, [form, isEdit, open, userDetail])

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload: UserFormData = {
        ...values,
        password: values.password || undefined,
      }

      if (isEdit) {
        if (!payload.password) {
          delete payload.password
        }

        return updateUser(userId!, payload)
      }

      return createUser(payload)
    },
    onSuccess: async () => {
      message.success(isEdit ? '用户更新成功' : '用户创建成功')
      await queryClient.invalidateQueries({ queryKey: ['system-users'] })
      onClose()
    },
  })

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await saveMutation.mutateAsync(values)
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '修改用户' : '创建用户'}
      width={720}
      okText="确认"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        void handleSubmit()
      }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        disabled={saveMutation.isPending || isFetchingDetail}
        initialValues={{
          username: '',
          nickname: '',
          password: '',
          email: '',
          mobile: '',
          status: 1,
          roles: [],
          deptId: null,
          postId: null,
          avatar: '',
        }}
      >
        <Form.Item label="头像" name="avatar">
          <ImageUpload businessId={1} businessType="demo" maxSize={2} />
        </Form.Item>

        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input disabled={isEdit} placeholder="输入用户名" />
        </Form.Item>

        <Form.Item
          label="昵称"
          name="nickname"
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input placeholder="输入昵称" />
        </Form.Item>

        {!isEdit ? (
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="输入密码" />
          </Form.Item>
        ) : null}

        <Form.Item label="邮箱" name="email">
          <Input placeholder="输入邮箱" />
        </Form.Item>

        <Form.Item label="手机号" name="mobile">
          <Input placeholder="输入手机号" />
        </Form.Item>

        <Form.Item
          label="角色"
          name="roles"
          rules={[{ required: true, type: 'array', min: 1, message: '请选择至少一个角色' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择角色"
            options={roleOptions.map((role) => ({
              label: role.roleName,
              value: role.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="部门" name="deptId">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            placeholder="选择部门"
            treeData={mapDeptTree(deptTree) ?? []}
          />
        </Form.Item>

        <Form.Item label="岗位" name="postId">
          <Select
            allowClear
            placeholder="选择岗位"
            options={postOptions.map((post) => ({
              label: post.postName,
              value: post.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="状态" name="status">
          <DictSelect dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
