<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="配置键" path="configKey">
          <NInput v-model:value="searchForm.configKey" placeholder="请输入配置键" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictSelect
            dictCode="BASE_STATUS"
            v-model:value="searchForm.status"
            class="w-48!"
            clearable
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
        <NSpace>
          <NButton type="primary" size="small" @click="openModal()" v-permission="['CONFIG_ADD']">
            <template #icon>
              <AppIcon icon="antd:PlusOutlined" />
            </template>
            新增配置
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="configList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="(row) => row.id"
      />
    </NCard>

    <ConfigModal ref="modalRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getConfigPage, deleteConfig, type Config } from '@/api/config'
import ConfigModal from './ConfigModal.vue'
import { useDialog, useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import DictSelect from '@/components/Dict/DictSelect.vue'
import DictTag from '@/components/Dict/DictTag.vue'
import DynamicIcon from '@/components/Icon/DynamicIcon.vue'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemConfig',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const modalRef = ref()

const searchForm = reactive({
  configKey: '',
  status: undefined as 0 | 1 | undefined,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const { data, isLoading, refetch } = useQuery({
  key: () => ['configs', queryState.value],
  query: () => getConfigPage(queryState.value),
})

const configList = computed(() => data.value?.data?.list || [])
const total = computed(() => data.value?.data?.total || 0)
const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response as { data?: { message?: string } } | undefined
    return response?.data?.message || '删除失败'
  }

  return '删除失败'
}

const deleteMutation = useMutation({
  mutation: (id: number) => deleteConfig(id),
  onSuccess: () => {
    message.success('配置删除成功')
    refetch()
  },
  onError: (error: unknown) => {
    message.error(getErrorMessage(error))
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

const columns: DataTableColumns<Config> = [
  { title: '配置键', key: 'configKey' },
  { title: '配置值', key: 'configValue', ellipsis: { tooltip: true } },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
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
    width: 150,
    render(row) {
      const actions = []

      if (hasPermission('CONFIG_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openModal(row.id),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:EditOutlined' }) },
          ),
        )
      }

      if (hasPermission('CONFIG_DELETE')) {
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
  searchForm.configKey = ''
  searchForm.status = undefined
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openModal = (id?: number) => {
  modalRef.value?.open(id)
}

const confirmDelete = (config: Config) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除配置"${config.configKey}"吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(config.id)
    },
  })
}
</script>
