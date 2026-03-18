import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Popconfirm, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { deletePost, getPostPage, type Post, type PostSearchParams } from '@/api/post'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { PostDialog } from '@/components/system/post/PostDialog'
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

export function PostPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<PostSearchParams>()
  const [query, setQuery] = useState<PostSearchParams>({
    postName: '',
    postCode: '',
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['posts', query],
    queryFn: () => getPostPage(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      message.success('岗位删除成功')
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
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

  const columns = useMemo<ColumnsType<Post>>(
    () => [
      { title: '岗位名称', dataIndex: 'postName', key: 'postName', width: 180 },
      { title: '岗位编码', dataIndex: 'postCode', key: 'postCode', width: 180 },
      { title: '排序', dataIndex: 'sort', key: 'sort', width: 90 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        render: (value: string | undefined) => value || '-',
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
        width: 140,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="POST_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingPostId(record.id)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="POST_DELETE">
              <Popconfirm
                title="确认删除岗位"
                description={`确定删除岗位“${record.postName}”吗？`}
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
        <Form form={form} layout="inline" initialValues={{ postName: '', postCode: '', status: undefined }}>
          <Form.Item label="岗位名称" name="postName">
            <Input allowClear placeholder="输入岗位名称" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="岗位编码" name="postCode">
            <Input allowClear placeholder="输入岗位编码" style={{ width: 180 }} />
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
                    postName: values.postName?.trim() || '',
                    postCode: values.postCode?.trim() || '',
                    status: values.status,
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
                    postName: '',
                    postCode: '',
                    status: undefined,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Typography.Title level={5} style={{ margin: 0 }}>
                岗位管理
              </Typography.Title>
              {isFetching ? <Typography.Text type="secondary">刷新中...</Typography.Text> : null}
            </Space>
            <PermissionGate permCode="POST_ADD">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingPostId(null)
                  setDialogOpen(true)
                }}
              >
                新增岗位
              </Button>
            </PermissionGate>
          </div>

          <Table<Post>
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

      <PostDialog
        open={dialogOpen}
        postId={editingPostId}
        onClose={() => {
          setDialogOpen(false)
          setEditingPostId(null)
        }}
      />
    </Space>
  )
}
