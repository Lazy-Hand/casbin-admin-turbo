<template>
  <div class="space-y-4">
    <!-- 搜索表单 -->
    <NForm inline :model="searchForm" label-placement="left" size="small">
      <NFormItem label="用户名">
        <NInput
          v-model:value="searchForm.username"
          placeholder="输入用户名"
          clearable
          class="w-40!"
        />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect
          v-model:value="searchForm.status"
          :options="statusOptions"
          placeholder="选择状态"
          clearable
          class="w-40!"
        />
      </NFormItem>
      <NFormItem label="时间范围">
        <NDatePicker v-model:value="dateRange" type="datetimerange" clearable class="w-80!" />
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

    <!-- 数据表格 -->
    <NDataTable
      :columns="columns"
      :data="logList"
      :loading="isLoading"
      :pagination="pagination"
      remote
      :row-key="getRowKey"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { getLoginLogList } from '@/api/login-log'
import { NTag, type DataTableColumns, type PaginationProps } from 'naive-ui'
import { h } from 'vue'

interface LoginLog {
  id: number
  userId: number | null
  username: string
  ip: string | null
  userAgent: string | null
  status: number
  message: string | null
  createdAt: string
}

defineOptions({
  name: 'LoginLogTab',
})

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const searchForm = reactive<{
  username: string
  status: number | undefined
  pageNo: number
  pageSize: number
}>({
  username: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10,
})

const dateRange = ref<[number, number] | null>(null)
const createQueryState = () => {
  const params: {
    username: string
    status: number | undefined
    pageNo: number
    pageSize: number
    startTime?: string
    endTime?: string
  } = {
    ...searchForm,
  }

  if (dateRange.value) {
    params.startTime = new Date(dateRange.value[0]).toISOString()
    params.endTime = new Date(dateRange.value[1]).toISOString()
  }

  return params
}
const queryState = ref(createQueryState())

const { data, isLoading } = useQuery({
  key: () => ['login-logs', queryState.value],
  query: () => getLoginLogList(queryState.value),
})

const logList = computed(() => data.value?.data.list || [])
const total = computed(() => data.value?.data.total || 0)

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  get itemCount() {
    return total.value
  },
  showSizePicker: true,
  pageSizes: [10, 20, 30],
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
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

const columns: DataTableColumns<LoginLog> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 180,
    render: (row) => formatTime(row.createdAt),
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
  },
  {
    title: 'IP',
    key: 'ip',
    width: 140,
    render: (row) => row.ip || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { type: row.status === 1 ? 'success' : 'error', size: 'small' },
        { default: () => (row.status === 1 ? '成功' : '失败') },
      ),
  },
  {
    title: '消息',
    key: 'message',
    ellipsis: { tooltip: true },
    width: 150,
    render: (row) => row.message || (row.status === 1 ? '登录成功' : '登录失败'),
  },
  {
    title: '终端',
    key: 'userAgent',
    ellipsis: { tooltip: true },
    render: (row) => row.userAgent || '-',
  },
]

const getRowKey = (row: LoginLog) => row.id

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.status = undefined
  dateRange.value = null
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}
</script>
