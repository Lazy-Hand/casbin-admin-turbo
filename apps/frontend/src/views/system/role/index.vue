<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="角色名称" path="roleName">
          <NInput v-model:value="searchForm.roleName" placeholder="Enter role name" />
        </NFormItem>
        <NFormItem label="角色编码" path="roleCode">
          <NInput v-model:value="searchForm.roleCode" placeholder="Enter role code" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictSelect dictCode="BASE_STATUS" v-model:value="searchForm.status" class="w-48" />
        </NFormItem>
        <NFormItem>
          <div class="flex gap-2">
            <NButton type="primary" @click="handleSearch">
              <template #icon>
                <AppIcon icon="antd:SearchOutlined" />
              </template>
              查询
            </NButton>
            <NButton @click="handleReset">
              <template #icon>
                <AppIcon icon="antd:ReloadOutlined" />
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
          <NButton type="primary" size="small" @click="openDrawer()" v-permission="['ROLE_ADD']">
            <template #icon>
              <AppIcon icon="antd:PlusOutlined" />
            </template>
            新增角色
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="roleList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="(row) => row.id"
      />
    </NCard>

    <RoleDialog ref="dialogRef" @success="refetch" />
    <RolePermissionDialog ref="permissionDialogRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getRoleList, deleteRole, type Role } from '@/api/role'
import RoleDialog from './RoleDialog.vue'
import RolePermissionDialog from './RolePermissionDialog.vue'
import { useDialog, useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  NTag,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import DictSelect from '@/components/Dict/DictSelect.vue'
import DictTag from '@/components/Dict/DictTag.vue'
import DynamicIcon from '@/components/Icon/DynamicIcon.vue'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemRole',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()
const permissionDialogRef = ref()

const searchForm = reactive({
  roleName: '',
  roleCode: '',
  status: null as 0 | 1 | null,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const { data, isLoading, refetch } = useQuery({
  key: () => ['roles', queryState.value],
  query: () => getRoleList(queryState.value),
})

const roleList = computed(() => data.value?.data?.list || [])
const total = computed(() => data.value?.data?.total || 0)

const deleteMutation = useMutation({
  mutation: (id: number) => deleteRole(id),
  onSuccess: () => {
    message.success('Role deleted')
    refetch()
  },
})

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  get itemCount() {
    return total.value
  },
  showSizePicker: true,
  pageSizes: [10, 20, 30],
  onChange: (page: number) => {
    pagination.page = page
    searchForm.pageNo = page
    queryState.value = createQueryState()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    searchForm.pageSize = pageSize
    searchForm.pageNo = 1
    queryState.value = createQueryState()
  },
})

const columns: DataTableColumns<Role> = [
  { title: '角色名称', key: 'roleName' },
  { title: '角色编码', key: 'roleCode' },
  { title: '描述', key: 'description' },
  {
    title: '数据范围',
    key: 'dataScope',
    render(row) {
      const dataScope = row.dataScope
      if (!dataScope) return '-'
      const scopeMap: Record<string, string> = {
        ALL: '全部数据',
        CUSTOM: '自定义部门',
        DEPT: '本部门',
        DEPT_AND_CHILD: '本部门及以下',
      }
      return h(
        NTag,
        { type: 'info', size: 'small' },
        { default: () => scopeMap[dataScope] || dataScope },
      )
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      return row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      const actions = []

      if (hasPermission('ROLE_PERMISSION')) {
        actions.push(
          h(
            NButton,
            {
              type: 'warning',
              text: true,
              size: 'small',
              title: '分配菜单权限',
              onClick: () => openPermissionDialog(row),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:KeyOutlined' }) },
          ),
        )
      }

      if (hasPermission('ROLE_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openDrawer(row.id),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:EditOutlined' }) },
          ),
        )
      }

      if (hasPermission('ROLE_DELETE')) {
        actions.push(
          h(
            NButton,
            {
              type: 'error',
              text: true,
              size: 'small',
              onClick: () => confirmDelete(row),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:DeleteOutlined' }) },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.roleName = ''
  searchForm.roleCode = ''
  searchForm.status = null
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openDrawer = (id?: number) => {
  dialogRef.value?.open(id)
}

const openPermissionDialog = (role: Role) => {
  permissionDialogRef.value?.open(role.id, role.roleName)
}

const confirmDelete = (role: Role) => {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete role "${role.roleName}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      deleteMutation.mutate(role.id)
    },
  })
}
</script>
