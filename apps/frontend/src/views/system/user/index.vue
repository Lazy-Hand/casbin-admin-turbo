<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="searchForm.username" placeholder="输入用户名" />
        </NFormItem>
        <NFormItem label="手机号" path="mobile">
          <NInput v-model:value="searchForm.mobile" placeholder="输入手机号" />
        </NFormItem>
        <NFormItem label="部门" path="deptId">
          <NTreeSelect
            v-model:value="searchForm.deptId"
            :options="deptOptions"
            placeholder="选择部门"
            clearable
            key-field="id"
            label-field="name"
            children-field="children"
            style="width: 180px"
          />
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
        <n-space>
          <NButton type="primary" size="small" @click="openDialog()" v-permission="['USER_ADD']">
            <template #icon>
              <AppIcon icon="antd:PlusOutlined" />
            </template>
            新增用户
          </NButton>
        </n-space>
      </div>

      <NDataTable
        :columns="columns"
        :data="userList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="(row) => row.id"
      />
    </NCard>

    <UserDialog ref="dialogRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getUserList, deleteUser, type User, type UserSearchParams } from '@/api/user'
import { getDeptTree } from '@/api/dept'
import UserDialog from './UserDialog.vue'
import { useDialog, useMessage } from 'naive-ui'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NTreeSelect,
  NButton,
  NDataTable,
  NTag,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import DictTag from '@/components/Dict/DictTag.vue'
import DynamicIcon from '@/components/Icon/DynamicIcon.vue'
import type { Dept } from '@/api/dept'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemUser',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()
const deptOptions = ref<Dept[]>([])

const searchForm = reactive<UserSearchParams>({
  username: '',
  mobile: '',
  deptId: null,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({
  username: searchForm.username,
  mobile: searchForm.mobile,
  deptId: searchForm.deptId,
  pageNo: searchForm.pageNo ?? 1,
  pageSize: searchForm.pageSize ?? 10,
})
const queryState = ref(createQueryState())

const fetchDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptOptions.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

// Fetch department tree on mount
fetchDeptTree()

const { data, isLoading, refetch } = useQuery({
  key: () => ['users', queryState.value],
  query: () => getUserList(queryState.value),
})

const userList = computed(() => data.value?.data.list || [])
const total = computed(() => data.value?.data.total || 0)

const deleteMutation = useMutation({
  mutation: (id: number) => deleteUser(id),
  onSuccess: () => {
    message.success('User deleted')
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
  prefix: ({ itemCount }) => `Total ${itemCount} items`,
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

const columns: DataTableColumns<User> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username' },
  { title: '昵称', key: 'nickname' },
  {
    title: '部门',
    key: 'dept',
    render(row) {
      return row.dept?.name || '-'
    },
  },
  {
    title: '岗位',
    key: 'post',
    render(row) {
      return row.post?.postName || '-'
    },
  },
  { title: '邮箱', key: 'email' },
  { title: '手机号', key: 'mobile' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  {
    title: '角色',
    key: 'roles',
    render(row) {
      if (!row.roles || row.roles.length === 0) return '-'
      return h(
        'div',
        { class: 'flex gap-1 flex-wrap' },
        row.roles.map((role) =>
          h(NTag, { type: 'info', size: 'small' }, { default: () => role.roleName }),
        ),
      )
    },
  },
  { title: '创建时间', key: 'createdAt' },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      const actions = []

      if (hasPermission('USER_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openDialog(row.id),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:EditOutlined' }) },
          ),
        )
      }

      if (hasPermission('USER_DELETE')) {
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
  searchForm.username = ''
  searchForm.mobile = ''
  searchForm.deptId = null
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openDialog = (id?: number) => {
  dialogRef.value?.open(id)
}

const confirmDelete = (user: User) => {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete user "${user.username}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      deleteMutation.mutate(user.id)
    },
  })
}
</script>
