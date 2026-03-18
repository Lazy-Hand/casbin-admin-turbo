import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  TreeSelect,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { deleteUser, getUserList, type User } from '@/api/user'
import { getDeptTree, type Dept } from '@/api/dept'
import { PermissionGate } from '@/components/PermissionGate'
import { UserDialog } from '@/components/system/user/UserDialog'
import { queryClient } from '@/lib/query-client'

type SearchFormValues = {
  username?: string
  mobile?: string
  deptId?: number | null
}

export function UserPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<SearchFormValues>()
  const [query, setQuery] = useState({
    username: '',
    mobile: '',
    deptId: null as number | null,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  const { data: deptOptions = [] } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDeptTree,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['system-users', query],
    queryFn: () => getUserList(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      message.success('用户已删除')
      await queryClient.invalidateQueries({ queryKey: ['system-users'] })
    },
  })
  const { mutateAsync: deleteUserAsync, isPending: isDeleting } = deleteMutation

  const treeData = useMemo(
    () =>
      deptOptions.map(function mapDept(node: Dept): { title: string; value: number; key: number; children?: ReturnType<typeof mapDept>[] } {
        return {
          title: node.name,
          value: node.id,
          key: node.id,
          children: node.children?.map(mapDept),
        }
      }),
    [deptOptions],
  )

  const columns = useMemo<ColumnsType<User>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 88 },
      { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
      { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 140 },
      {
        title: '部门',
        key: 'dept',
        width: 140,
        render: (_, record) => record.dept?.name || '-',
      },
      {
        title: '岗位',
        key: 'post',
        width: 140,
        render: (_, record) => record.post?.postName || '-',
      },
      { title: '邮箱', dataIndex: 'email', key: 'email', width: 180, render: (value: string | undefined) => value || '-' },
      { title: '手机号', dataIndex: 'mobile', key: 'mobile', width: 140, render: (value: string | undefined) => value || '-' },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => (
          <Tag color={value === 1 ? 'green' : 'default'}>
            {value === 1 ? '启用' : '禁用'}
          </Tag>
        ),
      },
      {
        title: '角色',
        key: 'roles',
        width: 220,
        render: (_, record) => {
          if (!record.roles?.length) {
            return '-'
          }

          return (
            <Space wrap size={[4, 4]}>
              {record.roles.map((role) => (
                <Tag key={role.id} color="blue">
                  {role.roleName}
                </Tag>
              ))}
            </Space>
          )
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string | undefined) => value || '-',
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 140,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="USER_EDIT">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingUserId(record.id)
                      setDialogOpen(true)
                    }}
                  />
                </PermissionGate>
            <PermissionGate permCode="USER_DELETE">
                  <Popconfirm
                title="确认删除用户"
                description={`确定删除用户“${record.username}”吗？`}
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  void deleteUserAsync(record.id)
                }}
              >
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                />
              </Popconfirm>
            </PermissionGate>
          </Space>
        ),
      },
    ],
    [deleteUserAsync, isDeleting],
  )

  const handleSearch = () => {
    const values = form.getFieldsValue()
    setQuery((current) => ({
      ...current,
      username: values.username?.trim() || '',
      mobile: values.mobile?.trim() || '',
      deptId: values.deptId ?? null,
      pageNo: 1,
    }))
  }

  const handleReset = () => {
    form.resetFields()
    setQuery({
      username: '',
      mobile: '',
      deptId: null,
      pageNo: 1,
      pageSize: 10,
    })
  }

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card>
        <Form
          form={form}
          layout="inline"
          initialValues={{
            username: '',
            mobile: '',
            deptId: null,
          }}
        >
          <Form.Item label="用户名" name="username">
            <Input allowClear placeholder="输入用户名" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="手机号" name="mobile">
            <Input allowClear placeholder="输入手机号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="部门" name="deptId">
            <TreeSelect
              allowClear
              placeholder="选择部门"
              style={{ width: 200 }}
              treeData={treeData}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
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
                用户管理
              </Typography.Title>
              {isFetching ? <Typography.Text type="secondary">刷新中...</Typography.Text> : null}
            </Space>
            <PermissionGate permCode="USER_ADD">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUserId(null)
                  setDialogOpen(true)
                }}
              >
                新增用户
              </Button>
            </PermissionGate>
          </div>

          <Table<User>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data?.list ?? []}
            scroll={{ x: 1440 }}
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
      <UserDialog
        open={dialogOpen}
        userId={editingUserId}
        onClose={() => {
          setDialogOpen(false)
          setEditingUserId(null)
        }}
      />
    </Space>
  )
}
