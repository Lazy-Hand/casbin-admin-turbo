import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Popconfirm, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { deleteConfig, getConfigPage, type Config, type ConfigSearchParams } from '@/api/config'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { ConfigDialog } from '@/components/system/config/ConfigDialog'
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

export function ConfigPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<ConfigSearchParams>()
  const [query, setQuery] = useState<ConfigSearchParams>({
    configKey: '',
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['configs', query],
    queryFn: () => getConfigPage(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteConfig,
    onSuccess: async () => {
      message.success('配置删除成功')
      await queryClient.invalidateQueries({ queryKey: ['configs'] })
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

  const columns = useMemo<ColumnsType<Config>>(
    () => [
      { title: '配置键', dataIndex: 'configKey', key: 'configKey', width: 200 },
      { title: '配置值', dataIndex: 'configValue', key: 'configValue', ellipsis: true },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (value: string | null | undefined) => value || '-',
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
        width: 120,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="CONFIG_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingConfigId(record.id)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="CONFIG_DELETE">
              <Popconfirm
                title="确认删除配置"
                description={`确定删除配置“${record.configKey}”吗？`}
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
        <Form form={form} layout="inline" initialValues={{ configKey: '', status: undefined }}>
          <Form.Item label="配置键" name="configKey">
            <Input allowClear placeholder="输入配置键" style={{ width: 180 }} />
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
                    configKey: values.configKey?.trim() || '',
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
                    configKey: '',
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
          <PermissionGate permCode="CONFIG_ADD">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingConfigId(null)
                setDialogOpen(true)
              }}
            >
              新增配置
            </Button>
          </PermissionGate>

          <Table<Config>
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

      <ConfigDialog
        open={dialogOpen}
        configId={editingConfigId}
        onClose={() => {
          setDialogOpen(false)
          setEditingConfigId(null)
        }}
      />
    </Space>
  )
}
