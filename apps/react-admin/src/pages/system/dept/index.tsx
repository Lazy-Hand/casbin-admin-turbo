import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons'
import { deleteDept, getDeptTree, type Dept } from '@/api/dept'
import { DictSelect } from '@/components/dict/DictSelect'
import { PermissionGate } from '@/components/PermissionGate'
import { DeptDialog } from '@/components/system/dept/DeptDialog'
import { queryClient } from '@/lib/query-client'

function filterByName(nodes: Dept[], name: string): Dept[] {
  const result: Dept[] = []
  for (const node of nodes) {
    if (node.name?.toLowerCase().includes(name.toLowerCase())) {
      result.push(node)
      continue
    }

    if (node.children?.length) {
      const children = filterByName(node.children, name)
      if (children.length) {
        result.push({ ...node, children })
      }
    }
  }
  return result
}

function filterByStatus(nodes: Dept[], status: number): Dept[] {
  const result: Dept[] = []
  for (const node of nodes) {
    if (node.status === status) {
      result.push(node)
      continue
    }

    if (node.children?.length) {
      const children = filterByStatus(node.children, status)
      if (children.length) {
        result.push({ ...node, children })
      }
    }
  }
  return result
}

function extractExpandedKeys(nodes: Dept[]): number[] {
  const keys: number[] = []
  const visit = (items: Dept[]) => {
    for (const item of items) {
      if (item.children?.length) {
        keys.push(item.id)
        visit(item.children)
      }
    }
  }
  visit(nodes)
  return keys
}

export function DeptPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ name?: string; status?: number }>()
  const [search, setSearch] = useState<{ name: string; status?: number }>({ name: '', status: undefined })
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null)
  const [parentId, setParentId] = useState<number | null>(null)

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDeptTree,
  })

  const filteredTree = useMemo(() => {
    let next = data
    if (search.name) {
      next = filterByName(next, search.name)
    }
    if (search.status !== undefined) {
      next = filterByStatus(next, search.status)
    }
    return next
  }, [data, search.name, search.status])

  const deleteMutation = useMutation({
    mutationFn: deleteDept,
    onSuccess: async () => {
      message.success('部门删除成功')
      await queryClient.invalidateQueries({ queryKey: ['dept-tree'] })
    },
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = error.response as { data?: { message?: string } } | undefined
        message.error(response?.data?.message || '删除失败')
        return
      }
      message.error('删除失败')
    },
  })

  const columns = useMemo<ColumnsType<Dept>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: '部门名称', dataIndex: 'name', key: 'name', width: 220 },
      {
        title: '负责人',
        key: 'leader',
        render: (_, record) => record.leader?.nickname || '-',
      },
      { title: '排序', dataIndex: 'sort', key: 'sort', width: 90 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <Tag color={value === 1 ? 'success' : 'default'}>{value === 1 ? '正常' : '停用'}</Tag>,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 140,
        render: (value: string | undefined) => (value ? new Date(value).toLocaleDateString() : '-'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="DEPT_EDIT">
              <Button
                type="text"
                size="small"
                onClick={() => {
                  setEditingDeptId(record.id)
                  setParentId(null)
                  setDialogOpen(true)
                }}
              >
                编辑
              </Button>
            </PermissionGate>
            <PermissionGate permCode="DEPT_ADD">
              <Button
                type="text"
                size="small"
                onClick={() => {
                  setEditingDeptId(null)
                  setParentId(record.id)
                  setDialogOpen(true)
                }}
              >
                新增下级
              </Button>
            </PermissionGate>
            <PermissionGate permCode="DEPT_DELETE">
              <Popconfirm
                title="确认删除部门"
                description={`确定删除部门“${record.name}”吗？`}
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  void deleteMutation.mutateAsync(record.id)
                }}
              >
                <Button danger type="text" size="small">
                  删除
                </Button>
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
        <Form form={form} layout="inline" initialValues={{ name: '', status: undefined }}>
          <Form.Item label="部门名称" name="name">
            <Input allowClear placeholder="输入部门名称" style={{ width: 180 }} />
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
                  setSearch({
                    name: values.name?.trim() || '',
                    status: values.status,
                  })
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields()
                  setSearch({ name: '', status: undefined })
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Typography.Title level={5} style={{ margin: 0 }}>
                部门管理
              </Typography.Title>
              {isFetching ? <Typography.Text type="secondary">刷新中...</Typography.Text> : null}
            </Space>
            <Space>
              <PermissionGate permCode="DEPT_ADD">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingDeptId(null)
                    setParentId(null)
                    setDialogOpen(true)
                  }}
                >
                  新增部门
                </Button>
              </PermissionGate>
              <Button icon={<DownOutlined />} onClick={() => setExpandedRowKeys(extractExpandedKeys(filteredTree))}>
                展开全部
              </Button>
              <Button icon={<UpOutlined />} onClick={() => setExpandedRowKeys([])}>
                折叠全部
              </Button>
            </Space>
          </div>

          <Table<Dept>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filteredTree}
            pagination={false}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as number[]),
            }}
          />
        </Space>
      </Card>

      <DeptDialog
        open={dialogOpen}
        deptId={editingDeptId}
        parentId={parentId}
        onClose={() => {
          setDialogOpen(false)
          setEditingDeptId(null)
          setParentId(null)
        }}
      />
    </Space>
  )
}
