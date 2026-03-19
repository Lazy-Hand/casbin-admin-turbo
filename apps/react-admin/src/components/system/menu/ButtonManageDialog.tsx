import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Drawer, Form, Input, Popconfirm, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { deleteMenu, getButtonPermissionPage, type Menu } from '@/api/menu'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { ButtonFormDialog } from '@/components/system/menu/ButtonFormDialog'
import { queryClient } from '@/lib/query-client'

function formatDateTime(value?: string) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

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

type Props = {
  open: boolean
  menuId?: number | null
  menuName?: string
  onClose: () => void
}

export function ButtonManageDialog({ open, menuId, menuName, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ permName?: string; permCode?: string }>()
  const [query, setQuery] = useState({
    permName: '',
    permCode: '',
    pageNo: 1,
    pageSize: 10,
  })
  const [buttonFormOpen, setButtonFormOpen] = useState(false)
  const [editingButtonId, setEditingButtonId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['menu-buttons', menuId, query],
    queryFn: () =>
      getButtonPermissionPage({
        parentId: menuId!,
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        permName: query.permName || undefined,
        permCode: query.permCode || undefined,
      }),
    enabled: open && Boolean(menuId),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      message.success('按钮删除成功')
      await queryClient.invalidateQueries({ queryKey: ['menu-buttons', menuId] })
      await queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })

  const columns = useMemo<ColumnsType<Menu>>(
    () => [
      { title: '按钮名称', dataIndex: 'permName', key: 'permName' },
      { title: '按钮编码', dataIndex: 'permCode', key: 'permCode' },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
      {
        title: '创建时间',
        key: 'createdAt',
        width: 180,
        render: (_, record) => {
          const value = record.createdAt || record.createTime
          return formatDateTime(value)
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="MENU_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingButtonId(record.id)
                  setButtonFormOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="MENU_DELETE">
              <Popconfirm
                title="确认删除按钮"
                description={`确定删除“${record.permName}”吗？`}
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
    <>
      <Drawer
        open={open}
        width={900}
        title={menuName ? `按钮管理 - ${menuName}` : '按钮管理'}
        onClose={onClose}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Card>
            <Form form={form} layout="inline" initialValues={{ permName: '', permCode: '' }}>
              <Form.Item label="按钮名称" name="permName">
                <Input allowClear placeholder="输入按钮名称" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item label="按钮编码" name="permCode">
                <Input allowClear placeholder="输入按钮编码" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => {
                      const values = form.getFieldsValue()
                      setQuery({
                        permName: values.permName?.trim() || '',
                        permCode: values.permCode?.trim() || '',
                        pageNo: 1,
                        pageSize: query.pageSize,
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
                        permName: '',
                        permCode: '',
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
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <PermissionGate permCode="MENU_ADD">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingButtonId(null)
                      setButtonFormOpen(true)
                    }}
                  >
                    新增按钮
                  </Button>
                </PermissionGate>
              </div>

              <Table<Menu>
                rowKey="id"
                loading={isLoading}
                columns={columns}
                dataSource={data?.list ?? []}
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
        </Space>
      </Drawer>

      {menuId ? (
        <ButtonFormDialog
          open={buttonFormOpen}
          menuId={menuId}
          buttonId={editingButtonId}
          onClose={() => {
            setButtonFormOpen(false)
            setEditingButtonId(null)
          }}
        />
      ) : null}
    </>
  )
}
