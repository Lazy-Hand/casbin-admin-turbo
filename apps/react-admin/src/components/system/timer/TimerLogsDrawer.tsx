import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Drawer, Empty, Select, Space, Spin, Tag } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { getTimerLogs } from '@/api/timer'

type Props = {
  open: boolean
  timerId?: number | null
  timerName?: string
  onClose: () => void
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

function formatDuration(ms?: number) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.round((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

export function TimerLogsDrawer({ open, timerId, timerName, onClose }: Props) {
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['timer-logs', timerId],
    queryFn: () => getTimerLogs(timerId!, 100),
    enabled: open && Boolean(timerId),
  })

  useEffect(() => {
    if (!open) {
      setStatusFilter(undefined)
    }
  }, [open])

  const filteredLogs = useMemo(
    () => (statusFilter === undefined ? data : data.filter((item) => item.status === statusFilter)),
    [data, statusFilter],
  )

  return (
    <Drawer
      open={open}
      width={860}
      title={timerName ? `${timerName} - 执行日志` : '执行日志'}
      onClose={onClose}
    >
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <Space>
            <span>状态:</span>
            <Select
              allowClear
              size="small"
              style={{ width: 120 }}
              placeholder="全部"
              value={statusFilter}
              options={[
                { label: '成功', value: 1 },
                { label: '失败', value: 0 },
              ]}
              onChange={(value) => setStatusFilter(value)}
            />
            <Button size="small" type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void refetch()}>
              刷新
            </Button>
          </Space>
        </div>

        <Spin spinning={isFetching}>
          {filteredLogs.length === 0 ? (
            <Empty description="暂无执行日志" />
          ) : (
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`mb-3 rounded-lg border-l-4 p-3 ${
                    log.status === 1
                      ? 'border-l-emerald-500 bg-emerald-50/50'
                      : 'border-l-rose-500 bg-rose-50/50'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Tag color={log.status === 1 ? 'success' : 'error'}>
                      {log.status === 1 ? '成功' : '失败'}
                    </Tag>
                    <span className="text-sm text-slate-600">{formatDateTime(log.startAt)}</span>
                    <span className="text-xs text-slate-500">耗时: {formatDuration(log.duration)}</span>
                  </div>
                  {log.result ? (
                    <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
                      {log.result}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Space>
    </Drawer>
  )
}
