import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App, Button, Card, Form, Input, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { getFileList, type FileEntity, type FileSearchParams } from '@/api/file'

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

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function FilePage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FileSearchParams>()
  const [query, setQuery] = useState<FileSearchParams>({
    fileType: '',
    isPublic: undefined,
    pageNo: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['files', query],
    queryFn: () => getFileList(query),
  })

  const columns = useMemo<ColumnsType<FileEntity>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: '文件名', dataIndex: 'filename', key: 'filename', width: 220 },
      {
        title: '原始名称',
        dataIndex: 'originalName',
        key: 'originalName',
        ellipsis: true,
      },
      {
        title: '大小',
        dataIndex: 'size',
        key: 'size',
        width: 120,
        render: (value: number) => formatFileSize(value),
      },
      { title: '类型', dataIndex: 'mimetype', key: 'mimetype', width: 180 },
      {
        title: '文件类型',
        dataIndex: 'fileType',
        key: 'fileType',
        width: 120,
        render: (value: string | undefined) => <Tag color="blue">{value || '-'}</Tag>,
      },
      {
        title: '公开',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: 100,
        render: (value: boolean | undefined) => (
          <Tag color={value ? 'success' : 'default'}>{value ? '是' : '否'}</Tag>
        ),
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
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                if (!record.url) {
                  message.warning('当前文件没有可预览地址')
                  return
                }
                window.open(record.url, '_blank', 'noopener,noreferrer')
              }}
            />
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => {
                if (!record.url) {
                  message.warning('当前文件没有下载地址')
                  return
                }
                window.open(record.url, '_blank', 'noopener,noreferrer')
              }}
            />
          </Space>
        ),
      },
    ],
    [message],
  )

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card>
        <Form form={form} layout="inline" initialValues={{ fileType: '', isPublic: undefined }}>
          <Form.Item label="文件类型" name="fileType">
            <Input allowClear placeholder="输入文件类型" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const values = form.getFieldsValue()
                  setQuery({
                    fileType: values.fileType?.trim() || '',
                    isPublic: values.isPublic,
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
                    fileType: '',
                    isPublic: undefined,
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
        <Table<FileEntity>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.list ?? []}
          scroll={{ x: 1300 }}
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
      </Card>
    </Space>
  )
}
