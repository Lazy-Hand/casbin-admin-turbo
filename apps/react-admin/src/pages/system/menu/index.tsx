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
  AppstoreOutlined,
} from '@ant-design/icons'
import { deleteMenu, getMenuList, type Menu } from '@/api/menu'
import { DictSelect } from '@/components/dict/DictSelect'
import { DictTag } from '@/components/dict/DictTag'
import { DynamicIcon } from '@/components/DynamicIcon'
import { PermissionGate } from '@/components/PermissionGate'
import { ButtonManageDialog } from '@/components/system/menu/ButtonManageDialog'
import { MenuDialog } from '@/components/system/menu/MenuDialog'
import { queryClient } from '@/lib/query-client'

export function MenuPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ permName?: string; status?: number | null }>()
  const [query, setQuery] = useState<{ permName?: string; status?: number | undefined }>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null)
  const [parentId, setParentId] = useState<number | null>(null)
  const [buttonDialog, setButtonDialog] = useState<{
    open: boolean
    id: number | null
    name: string
  }>({
    open: false,
    id: null,
    name: '',
  })

  const { data = [], isLoading } = useQuery({
    queryKey: ['menus', query],
    queryFn: () => getMenuList(query),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      message.success('菜单删除成功')
      await queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })

  const columns = useMemo<ColumnsType<Menu>>(
    () => [
      {
        title: '菜单名称',
        dataIndex: 'permName',
        key: 'permName',
        render: (value: string, record) => (record.menuType === 'divider' ? '分割线' : value),
      },
      {
        title: '图标',
        dataIndex: 'icon',
        key: 'icon',
        width: 80,
        render: (value: string | undefined) =>
          value ? <DynamicIcon icon={value} className="size-4" /> : null,
      },
      { title: '权限编码', dataIndex: 'permCode', key: 'permCode', width: 180 },
      { title: '路径', dataIndex: 'path', key: 'path', width: 180 },
      {
        title: '菜单类型',
        dataIndex: 'menuType',
        key: 'menuType',
        width: 110,
        render: (value: string) => <DictTag value={value} dictCode="MENU_TYPE" />,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: number) => <DictTag value={value} dictCode="BASE_STATUS" />,
      },
      { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
      {
        title: '操作',
        key: 'actions',
        width: 260,
        render: (_, record) => (
          <Space size={4}>
            <PermissionGate permCode="MENU_BUTTON">
              {record.menuType === 'page' || record.menuType === 'window' ? (
                <Button
                  type="text"
                  size="small"
                  icon={<AppstoreOutlined />}
                  onClick={() => {
                    setButtonDialog({
                      open: true,
                      id: record.id,
                      name: record.permName,
                    })
                  }}
                />
              ) : null}
            </PermissionGate>
            <PermissionGate permCode="MENU_ADD">
              {record.resourceType !== 'button' ? (
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingMenuId(null)
                    setParentId(record.id)
                    setDialogOpen(true)
                  }}
                />
              ) : null}
            </PermissionGate>
            <PermissionGate permCode="MENU_EDIT">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingMenuId(record.id)
                  setParentId(null)
                  setDialogOpen(true)
                }}
              />
            </PermissionGate>
            <PermissionGate permCode="MENU_DELETE">
              <Popconfirm
                title="确认删除菜单"
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
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card>
        <Form form={form} layout="inline" initialValues={{ permName: '', status: null }}>
          <Form.Item label="菜单名称" name="permName">
            <Input allowClear placeholder="输入菜单名称" style={{ width: 180 }} />
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
                    permName: values.permName?.trim() || undefined,
                    status: values.status ?? undefined,
                  })
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields()
                  setQuery({})
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
          <PermissionGate permCode="MENU_ADD">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingMenuId(null)
                setParentId(null)
                setDialogOpen(true)
              }}
            >
              新增菜单
            </Button>
          </PermissionGate>

          <Table<Menu>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={data}
            pagination={false}
            expandable={{ defaultExpandAllRows: true }}
          />
        </Space>
      </Card>

      <MenuDialog
        open={dialogOpen}
        menuId={editingMenuId}
        parentId={parentId}
        onClose={() => {
          setDialogOpen(false)
          setEditingMenuId(null)
          setParentId(null)
        }}
      />
      <ButtonManageDialog
        open={buttonDialog.open}
        menuId={buttonDialog.id}
        menuName={buttonDialog.name}
        onClose={() => {
          setButtonDialog({
            open: false,
            id: null,
            name: '',
          })
        }}
      />
    </Space>
  )
}
