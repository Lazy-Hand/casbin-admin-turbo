<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="菜单名称" path="permName">
          <NInput v-model:value="searchForm.permName" placeholder="输入菜单名称" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictSelect dictCode="BASE_STATUS" v-model:value="searchForm.status" class="w-48!" />
        </NFormItem>
        <NFormItem>
          <div class="flex gap-2">
            <NButton type="primary" @click="handleSearch">
              <template #icon>
                <i class="pi pi-search" />
              </template>
              查询
            </NButton>
            <NButton @click="handleReset">
              <template #icon>
                <i class="pi pi-refresh" />
              </template>
              重置
            </NButton>
          </div>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard>
      <div class="flex justify-between items-center mb-4">
        <NSpace>
          <NButton type="primary" size="small" @click="openDialog()" v-permission="['MENU_ADD']">
            <template #icon>
              <i class="pi pi-plus" />
            </template>
            新增菜单
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="menuTree"
        :loading="isLoading"
        :row-key="(row) => row.id"
        children-key="children"
        default-expand-all
      />
    </NCard>

    <MenuDialog ref="dialogRef" @success="refetch" />
    <ButtonManageDialog ref="buttonManageDialogRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getMenuList, deleteMenu, type Menu } from '@/api/menu'
import MenuDialog from './MenuDialog.vue'
import ButtonManageDialog from './ButtonManageDialog.vue'
import { useDialog, useMessage } from 'naive-ui'
import DictTag from '@/components/Dict/DictTag.vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  type DataTableColumns,
} from 'naive-ui'
import { renderIcon } from '@/layouts/composables/useMenu'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemMenu',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()
const buttonManageDialogRef = ref()

const searchForm = reactive({
  permName: '',
  status: null as number | null,
})
const createQueryState = () => ({
  permName: searchForm.permName || undefined,
  status: searchForm.status || undefined,
})
const queryState = ref(createQueryState())

const { data, isLoading, refetch } = useQuery({
  key: () => ['menus', queryState.value],
  query: () => getMenuList(queryState.value),
})

const menuTree = computed<Menu[]>(() => data.value?.data || [])

const deleteMutation = useMutation({
  mutation: (id: number) => deleteMenu(id),
  onSuccess: () => {
    message.success('Menu deleted')
    refetch()
  },
})

const columns: DataTableColumns<Menu> = [
  {
    title: '菜单名称',
    key: 'permName',
    render(row) {
      return row.menuType === 'divider' ? h('span', null, '分割线') : row.permName
    },
  },
  {
    title: '图标',
    key: 'icon',
    render(row) {
      return row.icon ? renderIcon(row.icon)!() : null
    },
  },
  { title: '权限编码', key: 'permCode' },
  { title: '路径', key: 'path' },
  {
    title: '菜单类型',
    key: 'menuType',
    render(row) {
      return h(DictTag, { value: row.menuType, dictCode: 'MENU_TYPE' })
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  { title: '排序', key: 'sort', width: 80 },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    render(row) {
      const actions = []

      if (hasPermission('MENU_BUTTON') && (row.menuType === 'page' || row.menuType === 'window')) {
        actions.push(
          h(
            NButton,
            {
              type: 'warning',
              text: true,
              size: 'small',
              title: '按钮管理',
              onClick: () => openButtonManageDialog(row),
            },
            { icon: () => h('i', { class: 'pi pi-th-large' }) },
          ),
        )
      }

      if (hasPermission('MENU_ADD') && row.resourceType !== 'button') {
        actions.push(
          h(
            NButton,
            {
              type: 'info',
              text: true,
              size: 'small',
              onClick: () => openDialog(undefined, row.id),
              title: 'Add Child',
            },
            { icon: () => h('i', { class: 'pi pi-plus' }) },
          ),
        )
      }

      if (hasPermission('MENU_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openDialog(row.id),
            },
            { icon: () => h('i', { class: 'pi pi-pencil' }) },
          ),
        )
      }

      if (hasPermission('MENU_DELETE')) {
        actions.push(
          h(
            NButton,
            {
              type: 'error',
              text: true,
              size: 'small',
              onClick: () => confirmDelete(row),
            },
            { icon: () => h('i', { class: 'pi pi-trash' }) },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const handleSearch = () => {
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.permName = ''
  searchForm.status = null
  queryState.value = createQueryState()
}

const openDialog = (id?: number, parentId?: number) => {
  dialogRef.value?.open(id, parentId)
}

const openButtonManageDialog = (menu: Menu) => {
  buttonManageDialogRef.value?.open(menu.id, menu.permName)
}

const confirmDelete = (menu: Menu) => {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete "${menu.permName}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      deleteMutation.mutate(menu.id)
    },
  })
}
</script>
