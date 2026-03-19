import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, InputNumber, Modal, Select, TreeSelect } from 'antd'
import type { TreeSelectProps } from 'antd'
import {
  createDept,
  getDeptDetail,
  getDeptTree,
  updateDept,
  type Dept,
  type DeptFormData,
} from '@/api/dept'
import { getAllUsers } from '@/api/user'
import { DictSelect } from '@/components/dict/DictSelect'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  deptId?: number | null
  parentId?: number | null
  onClose: () => void
}

function mapDeptTree(nodes: Dept[]): TreeSelectProps['treeData'] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children?.length ? mapDeptTree(node.children) : undefined,
  }))
}

export function DeptDialog({ open, deptId, parentId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<DeptFormData>()
  const isEdit = Boolean(deptId)

  const { data: deptTree = [] } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDeptTree,
    enabled: open,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: getAllUsers,
    enabled: open,
  })

  const { data: detail, isFetching } = useQuery({
    queryKey: ['dept-detail', deptId],
    queryFn: () => getDeptDetail(deptId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && detail) {
      form.setFieldsValue({
        name: detail.name,
        parentId: detail.parentId || null,
        leaderId: detail.leaderId || null,
        status: detail.status,
        sort: detail.sort,
        remark: detail.remark || '',
      })
      return
    }

    form.setFieldsValue({
      name: '',
      parentId: parentId ?? null,
      leaderId: null,
      status: 1,
      sort: 0,
      remark: '',
    })
  }, [detail, form, isEdit, open, parentId])

  const saveMutation = useMutation({
    mutationFn: async (values: DeptFormData) => {
      if (isEdit) {
        return updateDept(deptId!, values)
      }
      return createDept(values)
    },
    onSuccess: async () => {
      message.success(isEdit ? '部门更新成功' : '部门创建成功')
      await queryClient.invalidateQueries({ queryKey: ['dept-tree'] })
      onClose()
    },
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = error.response as { data?: { message?: string } } | undefined
        message.error(response?.data?.message || '操作失败')
        return
      }
      message.error('操作失败')
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改部门' : '创建部门'}
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
        <Form.Item label="上级部门" name="parentId">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            placeholder="选择上级部门"
            treeData={mapDeptTree(deptTree) ?? []}
          />
        </Form.Item>
        <Form.Item
          label="部门名称"
          name="name"
          rules={[{ required: true, message: '请输入部门名称' }]}
        >
          <Input placeholder="输入部门名称" />
        </Form.Item>
        <Form.Item label="负责人" name="leaderId">
          <Select
            allowClear
            showSearch
            placeholder="选择负责人"
            options={users.map((user) => ({
              label: `${user.nickname} (${user.username})`,
              value: user.id,
            }))}
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item label="显示排序" name="sort">
          <InputNumber style={{ width: '100%' }} min={0} placeholder="输入排序" />
        </Form.Item>
        <Form.Item label="部门状态" name="status">
          <DictSelect dictCode="BASE_STATUS" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={3} placeholder="输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
