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
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import {
  deleteDictionary,
  getDictionaryList,
  type Dictionary,
  type DictionarySearchParams,
} from '@/api/dictionary'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { DictionaryDialog } from '@/components/system/dictionary/DictionaryDialog'
import { DictionaryItemDrawer } from '@/components/system/dictionary/DictionaryItemDrawer'
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

export function DictionaryPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<DictionarySearchParams>()
  const [query, setQuery] = useState<DictionarySearchParams>({
    dictName: '',
    dictCode: '',
    status: undefined,
    pageNo: 1,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDictionaryId, setEditingDictionaryId] = useState<number | null>(null)
  const [drawerState, setDrawerState] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dict-types', query],
    queryFn: () => getDictionaryList(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDictionary,
    onSuccess: async () => {
      message.success('字典删除成功')
      await queryClient.invalidateQueries({ queryKey: ['dict-types'] })
    },
  })

  const columns = useMemo<ColumnsType<Dictionary>>(
    () => [
      { title: '字典名称', dataIndex: 'dictName', key: 'dictName', width: 180 },
      { title: '字典编码', dataIndex: 'dictCode', key: 'dictCode', width: 180 },
      { title: '描述', dataIndex: 'description', key: 'description' },
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
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="DICT_ITEM">
              <Button
                type="text"
                size="small"
                icon={<UnorderedListOutlined />}
                onClick={() => {
                  setDrawerState({
                    open: true,
                    id: record.id,
                    name: record.dictName,
                  })
                }}
              >
                字典项
              </Button>
            </PermissionGate>
            <PermissionGate permCode="DICT_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingDictionaryId(record.id)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="DICT_DELETE">
              <Popconfirm
                title="确认删除字典"
                description={`确定删除字典“${record.dictName}”吗？`}
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

  const handleSearch = () => {
    const values = form.getFieldsValue()
    setQuery({
      dictName: values.dictName?.trim() || '',
      dictCode: values.dictCode?.trim() || '',
      status: values.status,
      pageNo: 1,
      pageSize: query.pageSize ?? 10,
    })
  }

  const handleReset = () => {
    form.resetFields()
    setQuery({
      dictName: '',
      dictCode: '',
      status: undefined,
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
            dictName: '',
            dictCode: '',
            status: undefined,
          }}
        >
          <Form.Item label="字典名称" name="dictName">
            <Input allowClear placeholder="输入字典名称" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="字典编码" name="dictCode">
            <Input allowClear placeholder="输入字典编码" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <DictSelect dictCode="BASE_STATUS" style={{ width: 180 }} />
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
                字典管理
              </Typography.Title>
              {isFetching ? <Typography.Text type="secondary">刷新中...</Typography.Text> : null}
            </Space>
            <PermissionGate permCode="DICT_ADD">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDictionaryId(null)
                  setDialogOpen(true)
                }}
              >
                新增字典
              </Button>
            </PermissionGate>
          </div>

          <Table<Dictionary>
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
        </Space>
      </Card>

      <DictionaryDialog
        open={dialogOpen}
        dictionaryId={editingDictionaryId}
        onClose={() => {
          setDialogOpen(false)
          setEditingDictionaryId(null)
        }}
      />
      <DictionaryItemDrawer
        open={drawerState.open}
        dictTypeId={drawerState.id}
        dictName={drawerState.name}
        onClose={() => {
          setDrawerState({
            open: false,
            id: null,
            name: '',
          })
        }}
      />
    </Space>
  )
}
