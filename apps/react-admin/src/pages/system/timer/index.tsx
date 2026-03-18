import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Popconfirm, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { deleteTimer, getTimerList, runTimer, type Timer, type TimerSearchParams } from '@/api/timer'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { TimerDialog } from '@/components/system/timer/TimerDialog'
import { TimerLogsDrawer } from '@/components/system/timer/TimerLogsDrawer'
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

export function TimerPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<TimerSearchParams>()
  const [query, setQuery] = useState<TimerSearchParams>({
    name: '',
    taskType: undefined,
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTimerId, setEditingTimerId] = useState<number | null>(null)
  const [logsDrawer, setLogsDrawer] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['timers', query],
    queryFn: () => getTimerList(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTimer,
    onSuccess: async () => {
      message.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: ['timers'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const runMutation = useMutation({
    mutationFn: runTimer,
    onSuccess: () => {
      message.success('执行已触发')
    },
    onError: () => {
      message.error('触发执行失败')
    },
  })

  const columns = useMemo<ColumnsType<Timer>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: 'Cron 表达式',
        dataIndex: 'cron',
        key: 'cron',
        width: 180,
        render: (value: string) => <Tag color="blue">{value}</Tag>,
      },
      {
        title: '任务类型',
        dataIndex: 'taskType',
        key: 'taskType',
        width: 120,
        render: (value: string) => <DictTag value={value} dictCode="TASK_TYPE" />,
      },
      {
        title: '目标',
        dataIndex: 'target',
        key: 'target',
        ellipsis: true,
        render: (value: string) => <span className="text-xs">{value}</span>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      {
        title: '上次执行',
        dataIndex: 'lastRunAt',
        key: 'lastRunAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
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
        width: 180,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="TIMER_RUN">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  void runMutation.mutateAsync(record.id)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="TIMER_LOG">
              <Button
                type="text"
                size="small"
                icon={<UnorderedListOutlined />}
                onClick={() => {
                  setLogsDrawer({
                    open: true,
                    id: record.id,
                    name: record.name,
                  })
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="TIMER_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingTimerId(record.id)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="TIMER_DELETE">
              <Popconfirm
                title="确认删除定时任务"
                description={`确定删除定时任务“${record.name}”吗？`}
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
    [deleteMutation, runMutation],
  )

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card>
        <Form form={form} layout="inline" initialValues={{ name: '', taskType: undefined, status: undefined }}>
          <Form.Item label="名称" name="name">
            <Input allowClear placeholder="输入任务名称" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="任务类型" name="taskType">
            <DictSelect dictCode="TASK_TYPE" style={{ width: 180 }} />
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
                    name: values.name?.trim() || '',
                    taskType: values.taskType,
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
                    name: '',
                    taskType: undefined,
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
          <PermissionGate permCode="TIMER_ADD">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTimerId(null)
                setDialogOpen(true)
              }}
            >
              新增定时任务
            </Button>
          </PermissionGate>

          <Table<Timer>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data?.list ?? []}
            scroll={{ x: 1400 }}
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

      <TimerDialog
        open={dialogOpen}
        timerId={editingTimerId}
        onClose={() => {
          setDialogOpen(false)
          setEditingTimerId(null)
        }}
      />

      <TimerLogsDrawer
        open={logsDrawer.open}
        timerId={logsDrawer.id}
        timerName={logsDrawer.name}
        onClose={() => {
          setLogsDrawer({
            open: false,
            id: null,
            name: '',
          })
        }}
      />
    </Space>
  )
}
