import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, DatePicker, Form, Input, Select, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { getLoginLogList, type LoginLog } from '@/api/log'

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

export function LoginLogTab() {
  const [form] = Form.useForm<{
    username?: string
    status?: number
  }>()
  const [query, setQuery] = useState<{
    username: string
    status?: number
    pageNo: number
    pageSize: number
    startTime?: string
    endTime?: string
  }>({
    username: '',
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['login-logs', query],
    queryFn: () => getLoginLogList(query),
  })

  const columns = useMemo<ColumnsType<LoginLog>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (value: number) => (
          <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '成功' : '失败'}</Tag>
        ),
      },
      {
        title: '消息',
        dataIndex: 'message',
        key: 'message',
        width: 150,
        ellipsis: true,
        render: (value: string | null, record) =>
          value || (record.status === 1 ? '登录成功' : '登录失败'),
      },
      {
        title: '终端',
        dataIndex: 'userAgent',
        key: 'userAgent',
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
    ],
    [],
  )

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Form form={form} layout="inline" initialValues={query}>
        <Form.Item label="用户名" name="username">
          <Input allowClear placeholder="输入用户名" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select
            allowClear
            placeholder="选择状态"
            style={{ width: 160 }}
            options={[
              { label: '成功', value: 1 },
              { label: '失败', value: 0 },
            ]}
          />
        </Form.Item>
        <Form.Item label="时间范围">
          <DatePicker.RangePicker
            showTime
            style={{ width: 320 }}
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([
                  new Date(dateStrings[0]).toISOString(),
                  new Date(dateStrings[1]).toISOString(),
                ])
                return
              }
              setDateRange(null)
            }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                const values = form.getFieldsValue()
                setQuery({
                  username: values.username?.trim() || '',
                  status: values.status,
                  startTime: dateRange?.[0],
                  endTime: dateRange?.[1],
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
                setDateRange(null)
                setQuery({
                  username: '',
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

      <Table<LoginLog>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.list ?? []}
        scroll={{ x: 1000 }}
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
  )
}
