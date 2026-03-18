import { useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal, Select, TreeSelect } from 'antd'
import type { TreeSelectProps } from 'antd'
import { createRole, DataScope, getRole, updateRole, type RoleParams } from '@/api/role'
import { getDeptTree, type Dept } from '@/api/dept'
import { DictRadio } from '@/components/dict/DictRadio'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  roleId?: number | null
  onClose: () => void
}

type RoleFormValues = {
  roleName: string
  roleCode: string
  description?: string
  status: 0 | 1
  dataScope?: DataScope
  customDepts?: number[]
}

function mapDeptTree(nodes: Dept[]): TreeSelectProps['treeData'] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children?.length ? mapDeptTree(node.children) : undefined,
  }))
}

function toDataScopeValue(value?: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD') {
  if (!value) return undefined
  const map: Record<NonNullable<RoleFormValues['dataScope']>, typeof value> = {
    [DataScope.ALL]: 'ALL',
    [DataScope.CUSTOM]: 'CUSTOM',
    [DataScope.DEPT]: 'DEPT',
    [DataScope.DEPT_AND_CHILD]: 'DEPT_AND_CHILD',
  }
  const entry = Object.entries(map).find(([, scope]) => scope === value)
  return entry ? Number(entry[0]) as DataScope : undefined
}

export function RoleDialog({ open, roleId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<RoleFormValues>()
  const isEdit = Boolean(roleId)
  const currentDataScope = Form.useWatch('dataScope', form)

  const { data: deptTree = [] } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDeptTree,
    enabled: open,
  })

  const { data: roleDetail, isFetching } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => getRole(roleId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && roleDetail) {
      form.setFieldsValue({
        roleName: roleDetail.roleName,
        roleCode: roleDetail.roleCode,
        description: roleDetail.description || '',
        status: roleDetail.status,
        dataScope: toDataScopeValue(roleDetail.dataScope),
        customDepts: roleDetail.customDepts || [],
      })
      return
    }

    form.setFieldsValue({
      roleName: '',
      roleCode: '',
      description: '',
      status: 1,
      dataScope: undefined,
      customDepts: [],
    })
  }, [form, isEdit, open, roleDetail])

  useEffect(() => {
    if (currentDataScope !== DataScope.CUSTOM) {
      form.setFieldValue('customDepts', [])
    }
  }, [currentDataScope, form])

  const saveMutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      const payload: RoleParams = {
        roleName: values.roleName,
        roleCode: values.roleCode,
        description: values.description?.trim() || '',
        status: values.status,
        dataScope: values.dataScope,
        customDepts: values.dataScope === DataScope.CUSTOM ? values.customDepts || [] : [],
      }

      if (isEdit) {
        return updateRole(roleId!, payload)
      }

      return createRole(payload)
    },
    onSuccess: async () => {
      message.success(isEdit ? '角色更新成功' : '角色创建成功')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['role-options'] })
      onClose()
    },
  })

  const deptTreeData = useMemo(() => mapDeptTree(deptTree), [deptTree])

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改角色' : '新增角色'}
      width={640}
      okText="确认"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => saveMutation.mutate(values))
      }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        disabled={saveMutation.isPending || isFetching}
        initialValues={{
          roleName: '',
          roleCode: '',
          description: '',
          status: 1,
          dataScope: undefined,
          customDepts: [],
        }}
      >
        <Form.Item label="角色名称" name="roleName" rules={[{ required: true, message: '请输入角色名称' }]}>
          <Input placeholder="输入角色名称" />
        </Form.Item>
        <Form.Item
          label="角色编码"
          name="roleCode"
          rules={[
            { required: true, message: '请输入角色编码' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字和下划线' },
          ]}
        >
          <Input placeholder="输入角色编码" />
        </Form.Item>
        <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
          <DictRadio dictCode="BASE_STATUS" />
        </Form.Item>
        <Form.Item label="数据范围" name="dataScope">
          <Select
            allowClear
            placeholder="选择数据范围"
            options={[
              { label: '全部数据', value: DataScope.ALL },
              { label: '自定义部门', value: DataScope.CUSTOM },
              { label: '本部门', value: DataScope.DEPT },
              { label: '本部门及以下', value: DataScope.DEPT_AND_CHILD },
            ]}
          />
        </Form.Item>
        {currentDataScope === DataScope.CUSTOM ? (
          <Form.Item label="自定义部门" name="customDepts">
            <TreeSelect
              treeCheckable
              multiple
              allowClear
              treeDefaultExpandAll
              placeholder="选择自定义部门"
              treeData={deptTreeData}
            />
          </Form.Item>
        ) : null}
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} placeholder="输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
