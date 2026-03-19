import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Button, Drawer, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  createDictionaryItem,
  deleteDictionaryItem,
  getDictionaryItemList,
  updateDictionaryItem,
  type DictionaryItem,
} from '@/api/dictionary'
import { DictTag } from '@/components/dict/DictTag'
import { PermissionGate } from '@/components/PermissionGate'
import { queryClient } from '@/lib/query-client'
import { DictionaryItemDialog } from '@/components/system/dictionary/DictionaryItemDialog'

type Props = {
  open: boolean
  dictTypeId?: number | null
  dictName?: string
  onClose: () => void
}

export function DictionaryItemDrawer({ open, dictTypeId, dictName, onClose }: Props) {
  const { message } = App.useApp()
  const [editingItem, setEditingItem] = useState<Partial<DictionaryItem> | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['dict-items', dictTypeId],
    queryFn: () => getDictionaryItemList(dictTypeId!),
    enabled: open && Boolean(dictTypeId),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dict-items', dictTypeId] })
  }

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<DictionaryItem>) => {
      const payload = {
        ...values,
        dictTypeId: dictTypeId ?? undefined,
      }

      if (editingItem?.id) {
        return updateDictionaryItem({ ...payload, id: editingItem.id })
      }

      return createDictionaryItem(payload)
    },
    onSuccess: async () => {
      message.success(editingItem?.id ? '字典项更新成功' : '字典项创建成功')
      await refresh()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDictionaryItem,
    onSuccess: async () => {
      message.success('字典项删除成功')
      await refresh()
    },
  })

  const columns = useMemo<ColumnsType<DictionaryItem>>(
    () => [
      { title: '标签', dataIndex: 'label', key: 'label' },
      { title: '值', dataIndex: 'value', key: 'value' },
      {
        title: '颜色类型',
        dataIndex: 'colorType',
        key: 'colorType',
        render: (value: string) => (value ? <Tag>{value}</Tag> : '-'),
      },
      { title: '排序', dataIndex: 'sort', key: 'sort', width: 90 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="DICT_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditingItem(record)}
              />
            </PermissionGate>
            <PermissionGate permCode="DICT_DELETE">
              <Popconfirm
                title="确认删除字典项"
                description={`确定删除“${record.label}”吗？`}
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
        width={860}
        title={dictName ? `${dictName} - 字典项` : '字典项列表'}
        onClose={onClose}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text type="secondary">管理当前字典下的所有字典项</Typography.Text>
            <PermissionGate permCode="DICT_ADD">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  setEditingItem({ dictTypeId: dictTypeId ?? undefined, status: 1, sort: 0 })
                }
              >
                新增字典项
              </Button>
            </PermissionGate>
          </div>

          <Table<DictionaryItem>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data}
            pagination={false}
          />
        </Space>
      </Drawer>
      <DictionaryItemDialog
        open={Boolean(editingItem)}
        initialValues={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
      />
    </>
  )
}
