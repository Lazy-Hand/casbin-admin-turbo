import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { getOperationLogList, type LogOperation, type OperationLog, type OperationLogSearchParams } from '@/api/log'

const moduleOptions = [
  { label: '用户', value: 'user' },
  { label: '角色', value: 'role' },
  { label: '权限', value: 'permission' },
  { label: '定时任务', value: 'timer' },
  { label: '文件', value: 'file' },
  { label: '字典', value: 'dict' },
]

const operationOptions = [
  { label: '创建', value: 'CREATE' },
  { label: '修改', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
]

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const moduleNameMap: Record<string, string> = {
  user: '用户',
  role: '角色',
  permission: '权限',
  timer: '定时任务',
  file: '文件',
  dict: '字典',
}

const operationTypeMap: Record<LogOperation, string> = {
  CREATE: '创建',
  UPDATE: '修改',
  DELETE: '删除',
}

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

export function OperationLogTab() {
  const [form] = Form.useForm<OperationLogSearchParams>()
  const [query, setQuery] = useState<OperationLogSearchParams>({
    username: '',
    module: undefined,
    operation: undefined,
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState<OperationLog | null>(null)
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['operation-logs', query],
    queryFn: () => getOperationLogList(query),
  })

  const columns = useMemo<ColumnsType<OperationLog>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      { title: '用户', dataIndex: 'username', key: 'username', width: 120 },
      {
        title: '模块',
        dataIndex: 'module',
        key: 'module',
        width: 100,
        render: (value: string) => <Tag color="blue">{moduleNameMap[value] || value}</Tag>,
      },
      {
        title: '操作',
        dataIndex: 'operation',
        key: 'operation',
        width: 80,
        render: (value: LogOperation) => {
          const colorMap: Record<LogOperation, string> = {
            CREATE: 'success',
            UPDATE: 'warning',
            DELETE: 'default',
          }
          return <Tag color={colorMap[value]}>{operationTypeMap[value]}</Tag>
        },
      },
      { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '耗时',
        dataIndex: 'duration',
        key: 'duration',
        width: 90,
        render: (value: number | null) => (value ? `${value}ms` : '-'),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (value: number) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '成功' : '失败'}</Tag>,
      },
      {
        title: '操作',
        key: 'actions',
        width: 80,
        render: (_, record) => (
          <Button
            size="small"
            type="link"
            onClick={() => {
              setCurrentLog(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>
        ),
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
        <Form.Item label="模块" name="module">
          <Select allowClear placeholder="选择模块" options={moduleOptions} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="操作类型" name="operation">
          <Select allowClear placeholder="选择操作类型" options={operationOptions} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select allowClear placeholder="选择状态" options={statusOptions} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="时间范围">
          <DatePicker.RangePicker
            showTime
            style={{ width: 320 }}
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([new Date(dateStrings[0]).toISOString(), new Date(dateStrings[1]).toISOString()])
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
                  module: values.module,
                  operation: values.operation,
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
                  module: undefined,
                  operation: undefined,
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

      <Table<OperationLog>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.list ?? []}
        scroll={{ x: 1200 }}
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

      <Drawer open={detailVisible} width={1200} title="日志详情" onClose={() => setDetailVisible(false)}>
        {currentLog ? (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="时间">{formatDateTime(currentLog.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="用户">{currentLog.username}</Descriptions.Item>
            <Descriptions.Item label="模块">{moduleNameMap[currentLog.module] || currentLog.module}</Descriptions.Item>
            <Descriptions.Item label="操作类型">{operationTypeMap[currentLog.operation]}</Descriptions.Item>
            <Descriptions.Item label="描述">{currentLog.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{currentLog.method}</Descriptions.Item>
            <Descriptions.Item label="请求路径">{currentLog.path}</Descriptions.Item>
            <Descriptions.Item label="客户端IP">{currentLog.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="耗时">{currentLog.duration ? `${currentLog.duration}ms` : '-'}</Descriptions.Item>
            <Descriptions.Item label="参数" span={2}>
              <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(currentLog.params, null, 2)}
              </pre>
            </Descriptions.Item>
            {currentLog.result ? (
              <Descriptions.Item label="结果" span={2}>
                <span className="text-rose-600">{currentLog.result}</span>
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ) : null}
      </Drawer>
    </Space>
  )
}
