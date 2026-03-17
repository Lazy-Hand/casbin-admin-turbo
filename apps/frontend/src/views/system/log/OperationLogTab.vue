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
      <NFormItem label="模块">
        <NSelect
          v-model:value="searchForm.module"
          :options="moduleOptions"
          placeholder="选择模块"
          clearable
          class="w-40!"
        />
      </NFormItem>
      <NFormItem label="操作类型">
        <NSelect
          v-model:value="searchForm.operation"
          :options="operationOptions"
          placeholder="选择操作类型"
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

    <!-- 详情抽屉 -->
    <NDrawer v-model:show="detailVisible" :width="1200">
      <NDrawerContent title="日志详情" :body-style="{ padding: '20px' }">
        <NDescriptions v-if="currentLog" :column="4" bordered>
          <NDescriptionsItem label="时间">
            {{ formatTime(currentLog.createdAt) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="用户">
            {{ currentLog.username }}
          </NDescriptionsItem>
          <NDescriptionsItem label="模块">
            {{ getModuleName(currentLog.module) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="操作类型">
            {{ getOperationText(currentLog.operation) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="描述">
            {{ currentLog.description || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="请求方法">
            {{ currentLog.method }}
          </NDescriptionsItem>
          <NDescriptionsItem label="请求路径">
            {{ currentLog.path }}
          </NDescriptionsItem>
          <NDescriptionsItem label="客户端IP">
            {{ currentLog.ip || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="耗时"> {{ currentLog.duration }}ms </NDescriptionsItem>
          <NDescriptionsItem label="参数" :span="2">
            <NCode :code="JSON.stringify(currentLog.params, null, 2)" language="json" />
          </NDescriptionsItem>
          <NDescriptionsItem v-if="currentLog.result" label="结果" :span="2">
            <NText type="error">{{ currentLog.result }}</NText>
          </NDescriptionsItem>
        </NDescriptions>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@pinia/colada'
import {
  getOperationLogList,
  type OperationLog,
  type OperationLogSearchParams,
  type LogOperation,
} from '@/api/operation-log'
import { NTag, NButton, type DataTableColumns, type PaginationProps } from 'naive-ui'
import { h } from 'vue'

defineOptions({
  name: 'OperationLogTab',
})

const moduleOptions = [
  { label: '用户', value: 'user' },
  { label: '角色', value: 'role' },
  { label: '权限', value: 'permission' },
  { label: '定时任务', value: 'timer' },
  { label: '文件', value: 'file' },
  { label: '字典', value: 'dict' },
]

const operationOptions = [
  { label: '创建', value: 'CREATE' },
  { label: '修改', value: 'UPDATE' },
  { label: '删除', value: 'DELETE' },
]

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const moduleNameMap: Record<string, string> = {
  user: '用户',
  role: '角色',
  permission: '权限',
  timer: '定时任务',
  file: '文件',
  dict: '字典',
}

const operationTypeMap: Record<LogOperation, string> = {
  CREATE: '创建',
  UPDATE: '修改',
  DELETE: '删除',
}

const getModuleName = (module: string) => moduleNameMap[module] || module
const getOperationText = (operation: LogOperation) => operationTypeMap[operation]

const searchForm = reactive<OperationLogSearchParams>({
  username: '',
  module: undefined,
  operation: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10,
})

const dateRange = ref<[number, number] | null>(null)
const detailVisible = ref(false)
const currentLog = ref<OperationLog | null>(null)
const createQueryState = () => {
  const params: OperationLogSearchParams = { ...searchForm }

  if (dateRange.value) {
    params.startTime = new Date(dateRange.value[0]).toISOString()
    params.endTime = new Date(dateRange.value[1]).toISOString()
  }

  return params
}
const queryState = ref(createQueryState())

const { data, isLoading } = useQuery({
  key: () => ['operation-logs', queryState.value],
  query: () => getOperationLogList(queryState.value),
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

const columns: DataTableColumns<OperationLog> = [
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
    title: '用户',
    key: 'username',
    width: 120,
  },
  {
    title: '模块',
    key: 'module',
    width: 100,
    render: (row) =>
      h(NTag, { type: 'info', size: 'small' }, { default: () => getModuleName(row.module) }),
  },
  {
    title: '操作',
    key: 'operation',
    width: 80,
    render: (row) => {
      const typeMap: Record<LogOperation, 'default' | 'success' | 'warning'> = {
        CREATE: 'success',
        UPDATE: 'warning',
        DELETE: 'default',
      }
      return h(
        NTag,
        { type: typeMap[row.operation], size: 'small' },
        { default: () => getOperationText(row.operation) },
      )
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: 'IP',
    key: 'ip',
    width: 140,
    render: (row) => row.ip || '-',
  },
  {
    title: '耗时',
    key: 'duration',
    width: 80,
    render: (row) => (row.duration ? `${row.duration}ms` : '-'),
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
    title: '操作',
    key: 'actions',
    width: 80,
    fixed: 'right' as const,
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          text: true,
          type: 'info',
          onClick: () => showDetail(row),
        },
        { default: () => '详情' },
      ),
  },
]

const getRowKey = (row: OperationLog) => row.id

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function showDetail(log: OperationLog) {
  currentLog.value = log
  detailVisible.value = true
}

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.module = undefined
  searchForm.operation = undefined
  searchForm.status = undefined
  dateRange.value = null
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}
</script>
