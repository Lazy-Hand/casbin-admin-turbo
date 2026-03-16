<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="名称" path="name">
          <NInput v-model:value="searchForm.name" placeholder="输入任务名称" />
        </NFormItem>
        <NFormItem label="任务类型" path="taskType">
          <DictSelect
            dict-code="TASK_TYPE"
            v-model:value="searchForm.taskType"
            class="w-48!"
            placeholder="请选择"
          />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictSelect
            dict-code="BASE_STATUS"
            v-model:value="searchForm.status"
            class="w-48!"
            placeholder="请选择"
          />
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
        <n-space>
          <NButton type="primary" size="small" @click="openDialog()" v-permission="['TIMER_ADD']">
            <template #icon>
              <i class="pi pi-plus" />
            </template>
            新增定时任务
          </NButton>
        </n-space>
      </div>

      <NDataTable
        :columns="columns"
        :data="timerList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="getRowKey"
      />
    </NCard>

    <TimerDialog ref="dialogRef" @success="refetch" />
    <TimerLogsDrawer ref="logsDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutation } from '@pinia/colada'
import {
  getTimerList,
  deleteTimer,
  runTimer,
  type Timer,
  type TimerSearchParams,
} from '@/api/timer'
import TimerDialog from './TimerDialog.vue'
import TimerLogsDrawer from './TimerLogsDrawer.vue'
import { useDialog, useMessage } from 'naive-ui'
import { NTag, NTooltip, NButton, type DataTableColumns, type PaginationProps } from 'naive-ui'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemTimer',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()
const logsDrawerRef = ref()

const searchForm = reactive<TimerSearchParams>({
  name: '',
  taskType: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const { data, isLoading, refetch } = useQuery({
  key: () => ['timers', queryState.value],
  query: () => getTimerList(queryState.value),
})

const timerList = computed(() => data.value?.data.list || [])
const total = computed(() => data.value?.data.total || 0)

const deleteMutation = useMutation({
  mutation: (id: number) => deleteTimer(id),
  onSuccess: () => {
    message.success('删除成功')
    refetch()
  },
  onError: () => {
    message.error('删除失败')
  },
})

const runMutation = useMutation({
  mutation: (id: number) => runTimer(id),
  onSuccess: () => {
    message.success('执行已触发')
  },
  onError: () => {
    message.error('触发执行失败')
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

const columns: DataTableColumns<Timer> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: 'Cron 表达式',
    key: 'cron',
    render(row) {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.cron })
    },
  },
  {
    title: '任务类型',
    key: 'taskType',
    render(row) {
      const type = row.taskType === 'HTTP' ? 'default' : 'warning'
      return h(NTag, { type, size: 'small' }, { default: () => row.taskType })
    },
  },
  {
    title: '目标',
    key: 'target',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'text-xs' }, row.target)
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      const type = row.status === 1 ? 'success' : 'default'
      const label = row.status === 1 ? '启用' : '禁用'
      return h(NTag, { type, size: 'small' }, { default: () => label })
    },
  },
  {
    title: '上次执行',
    key: 'lastRunAt',
    render(row) {
      return row.lastRunAt ? new Date(row.lastRunAt).toLocaleString() : '-'
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      return row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render(row) {
      const actions = []

      if (hasPermission('TIMER_RUN')) {
        actions.push(
          h(
            NTooltip,
            {},
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    type: 'info',
                    text: true,
                    size: 'small',
                    onClick: () => handleRun(row),
                  },
                  { icon: () => h('i', { class: 'pi pi-play' }) },
                ),
              default: () => '执行',
            },
          ),
        )
      }

      if (hasPermission('TIMER_LOG')) {
        actions.push(
          h(
            NTooltip,
            {},
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    type: 'warning',
                    text: true,
                    size: 'small',
                    onClick: () => openLogs(row),
                  },
                  { icon: () => h('i', { class: 'pi pi-calendar-times' }) },
                ),
              default: () => '日志',
            },
          ),
        )
      }

      if (hasPermission('TIMER_EDIT')) {
        actions.push(
          h(
            NTooltip,
            {},
            {
              trigger: () =>
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
              default: () => '编辑',
            },
          ),
        )
      }

      if (hasPermission('TIMER_DELETE')) {
        actions.push(
          h(
            NTooltip,
            {},
            {
              trigger: () =>
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
              default: () => '删除',
            },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const getRowKey = (row: Timer) => row.id

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.taskType = undefined
  searchForm.status = undefined
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openDialog = (id?: number) => {
  dialogRef.value?.open(id)
}

const openLogs = (timer: Timer) => {
  logsDrawerRef.value?.open(timer.id, timer.name)
}

const handleRun = (timer: Timer) => {
  dialog.info({
    title: '确认执行',
    content: `确定要手动执行定时任务 "${timer.name}" 吗？`,
    positiveText: '执行',
    negativeText: '取消',
    onPositiveClick: () => {
      runMutation.mutate(timer.id)
    },
  })
}

const confirmDelete = (timer: Timer) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除定时任务 "${timer.name}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(timer.id)
    },
  })
}
</script>
