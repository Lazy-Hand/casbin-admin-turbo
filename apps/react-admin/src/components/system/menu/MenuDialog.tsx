import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, InputNumber, Modal, Segmented, TreeSelect } from 'antd'
import type { TreeSelectProps } from 'antd'
import { createMenu, getMenu, getMenuList, updateMenu, type Menu, type MenuParams, type MenuType } from '@/api/menu'
import { DictRadio } from '@/components/dict/DictRadio'
import { DictSelect } from '@/components/dict/DictSelect'
import { IconSelect } from '@/components/icon/IconSelect'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  menuId?: number | null
  parentId?: number | null
  onClose: () => void
}

function processMenuTree(menus: Menu[]): TreeSelectProps['treeData'] {
  return menus.map((menu) => ({
    title: menu.menuType === 'divider' ? '分割线' : menu.permName,
    value: menu.id,
    key: menu.id,
    disabled: menu.menuType !== 'menu' && menu.menuType !== 'group',
    children: menu.children?.length ? processMenuTree(menu.children) : undefined,
  }))
}

export function MenuDialog({ open, menuId, parentId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<MenuParams>()
  const isEdit = Boolean(menuId)

  const { data: menuTree = [] } = useQuery({
    queryKey: ['menus-tree-options'],
    queryFn: () => getMenuList({}),
    enabled: open,
  })

  const { data, isFetching } = useQuery({
    queryKey: ['menu-detail', menuId],
    queryFn: () => getMenu(menuId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        permName: data.permName,
        permCode: data.permCode,
        menuType: data.menuType,
        path: data.path,
        component: data.component,
        icon: data.icon,
        sort: data.sort,
        status: data.status,
        parentId: data.parentId ?? undefined,
        resourceType: data.resourceType,
        cache: data.cache,
        hidden: data.hidden,
        frameUrl: data.frameUrl,
      })
      return
    }

    form.setFieldsValue({
      permName: '',
      permCode: '',
      menuType: 'page',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 1,
      parentId: parentId ?? undefined,
      resourceType: 'menu',
      cache: 1,
      hidden: 0,
      frameUrl: '',
    })
  }, [data, form, isEdit, open, parentId])

  const saveMutation = useMutation({
    mutationFn: async (values: MenuParams) => {
      const payload = { ...values }
      if (isEdit) {
        return updateMenu(menuId!, payload)
      }
      return createMenu(payload)
    },
    onSuccess: async () => {
      message.success(isEdit ? '菜单更新成功' : '菜单创建成功')
      await queryClient.invalidateQueries({ queryKey: ['menus'] })
      await queryClient.invalidateQueries({ queryKey: ['menus-tree-options'] })
      onClose()
    },
  })

  const currentMenuType = Form.useWatch('menuType', form) as MenuType | undefined

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改菜单' : '新增菜单'}
      width={880}
      okText="确认"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => saveMutation.mutate(values as MenuParams))
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" disabled={saveMutation.isPending || isFetching}>
        <Form.Item label="菜单类型" name="menuType">
          <Segmented
            options={[
              { label: '菜单', value: 'menu' },
              { label: '页面', value: 'page' },
              { label: '分组', value: 'group' },
              { label: '外链', value: 'link' },
              { label: '内链', value: 'iframe' },
              { label: '窗口', value: 'window' },
              { label: '分割线', value: 'divider' },
            ]}
            onChange={(value) => {
              if (value === 'iframe') {
                form.setFieldValue('component', 'iframe/index')
              }
            }}
          />
        </Form.Item>

        <Form.Item label="父菜单" name="parentId">
          <TreeSelect allowClear placeholder="选择父菜单" treeData={processMenuTree(menuTree) ?? []} />
        </Form.Item>
        <Form.Item label="菜单名称" name="permName" rules={[{ required: true, message: '请输入菜单名称' }]}>
          <Input placeholder="输入菜单名称" />
        </Form.Item>
        <Form.Item label="菜单编码" name="permCode" rules={[{ required: true, message: '请输入菜单编码' }]}>
          <Input placeholder="例如：System" />
        </Form.Item>
        <Form.Item label="图标" name="icon">
          <IconSelect />
        </Form.Item>
        <Form.Item
          label="路由路径"
          name="path"
          rules={[
            {
              required: ['menu', 'page', 'link', 'iframe', 'window', 'group'].includes(currentMenuType || ''),
              message: '请输入路由路径',
            },
          ]}
        >
          <Input placeholder={currentMenuType === 'link' ? '例如：https://example.com' : '例如：/system/user'} />
        </Form.Item>
        <Form.Item
          label="组件路径"
          name="component"
          rules={[
            {
              required: ['page', 'link', 'iframe', 'window'].includes(currentMenuType || ''),
              message: '请输入组件路径',
            },
          ]}
        >
          <Input disabled={currentMenuType === 'iframe'} placeholder="例如：system/user/index" />
        </Form.Item>
        <Form.Item label="排序顺序" name="sort">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictSelect dictCode="BASE_STATUS" />
        </Form.Item>
        <Form.Item label="是否缓存" name="cache">
          <DictRadio dictCode="YES_NO" />
        </Form.Item>
        <Form.Item label="是否隐藏" name="hidden">
          <DictRadio dictCode="YES_NO" />
        </Form.Item>
        <Form.Item label="内链地址" name="frameUrl">
          <Input placeholder="仅内链类型菜单使用，输入完整 URL 地址" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
