import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Popconfirm, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { deleteRole, getRoleList, type Role, type RoleSearchParams } from '@/api/role'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { RoleDialog } from '@/components/system/role/RoleDialog'
import { RolePermissionDialog } from '@/components/system/role/RolePermissionDialog'
import { queryClient } from '@/lib/query-client'

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function getDataScopeLabel(value?: Role['dataScope']) {
  const labelMap: Record<NonNullable<Role['dataScope']>, string> = {
    ALL: '全部数据',
    CUSTOM: '自定义部门',
    DEPT: '本部门',
    DEPT_AND_CHILD: '本部门及以下',
  }

  return value ? labelMap[value] || value : '-'
}

export function RolePage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<RoleSearchParams>()
  const [query, setQuery] = useState<RoleSearchParams>({
    roleName: '',
    roleCode: '',
    status: null,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [permissionDialog, setPermissionDialog] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['roles', query],
    queryFn: () => getRoleList(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      message.success('角色删除成功')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['role-options'] })
    },
  })

  const columns = useMemo<ColumnsType<Role>>(
    () => [
      { title: '角色名称', dataIndex: 'roleName', key: 'roleName', width: 160 },
      { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', width: 180 },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '数据范围',
        dataIndex: 'dataScope',
        key: 'dataScope',
        width: 140,
        render: (value: Role['dataScope']) =>
          value ? <Tag color="blue">{getDataScopeLabel(value)}</Tag> : '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="ROLE_PERMISSION">
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => {
                  setPermissionDialog({
                    open: true,
                    id: record.id,
                    name: record.roleName,
                  })
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="ROLE_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingRoleId(record.id)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="ROLE_DELETE">
              <Popconfirm
                title="确认删除角色"
                description={`确定删除角色“${record.roleName}”吗？`}
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  void deleteMutation.mutateAsync(record.id)
                }}
              >
                <Button danger type="text" size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </PermissionGate>
          </Space>
        ),
      },
    ],
    [deleteMutation],
  )

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card>
        <Form form={form} layout="inline" initialValues={{ roleName: '', roleCode: '', status: null }}>
          <Form.Item label="角色名称" name="roleName">
            <Input allowClear placeholder="输入角色名称" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="角色编码" name="roleCode">
            <Input allowClear placeholder="输入角色编码" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <DictSelect dictCode="BASE_STATUS" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const values = form.getFieldsValue()
                  setQuery({
                    roleName: values.roleName?.trim() || '',
                    roleCode: values.roleCode?.trim() || '',
                    status: values.status ?? null,
                    pageNo: 1,
                    pageSize: query.pageSize ?? 10,
                  })
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields()
                  setQuery({
                    roleName: '',
                    roleCode: '',
                    status: null,
                    pageNo: 1,
                    pageSize: 10,
                  })
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <PermissionGate permCode="ROLE_ADD">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRoleId(null)
                setDialogOpen(true)
              }}
            >
              新增角色
            </Button>
          </PermissionGate>

          <Table<Role>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data?.list ?? []}
            scroll={{ x: 1100 }}
            pagination={{
              current: query.pageNo,
              pageSize: query.pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 30],
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setQuery((current) => ({
                  ...current,
                  pageNo: page,
                  pageSize,
                }))
              },
            }}
          />
        </Space>
      </Card>

      <RoleDialog
        open={dialogOpen}
        roleId={editingRoleId}
        onClose={() => {
          setDialogOpen(false)
          setEditingRoleId(null)
        }}
      />

      <RolePermissionDialog
        open={permissionDialog.open}
        roleId={permissionDialog.id}
        roleName={permissionDialog.name}
        onClose={() => {
          setPermissionDialog({
            open: false,
            id: null,
            name: '',
          })
        }}
      />
    </Space>
  )
}
