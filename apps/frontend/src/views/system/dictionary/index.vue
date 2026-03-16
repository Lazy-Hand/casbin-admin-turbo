<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="字典名称" path="dictName">
          <NInput v-model:value="searchForm.dictName" placeholder="Enter dict name" />
        </NFormItem>
        <NFormItem label="字典编码" path="dictCode">
          <NInput v-model:value="searchForm.dictCode" placeholder="Enter dict code" />
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
          <NButton type="primary" size="small" @click="openNew()" v-permission="['DICT_ADD']">
            <template #icon>
              <i class="pi pi-plus" />
            </template>
            新增字典
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="dictList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="(row) => row.id"
      />
    </NCard>

    <DictionaryDialog ref="dialogRef" @success="refetch" />
    <DictionaryItemDrawer ref="drawerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import {
  getDictionaryList,
  deleteDictionary,
  type Dictionary,
  type DictionarySearchParams,
} from '@/api/dictionary'
import { useDialog, useMessage } from 'naive-ui'
import DictionaryDialog from './DictionaryDialog.vue'
import DictionaryItemDrawer from './components/DictionaryItemDrawer.vue'
import dayjs from 'dayjs'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  NSpace,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import DictSelect from '@/components/Dict/DictSelect.vue'
import DictTag from '@/components/Dict/DictTag.vue'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemDictionary',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()
const drawerRef = ref()

const searchForm = reactive<DictionarySearchParams>({
  dictName: '',
  dictCode: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const {
  data: queryData,
  isLoading,
  refetch,
} = useQuery({
  key: () => ['dictionaries', queryState.value],
  query: () => getDictionaryList(queryState.value),
})

const dictList = computed(() => queryData.value?.data?.list || [])
const total = computed(() => queryData.value?.data?.total || 0)

const deleteMutation = useMutation({
  mutation: (id: number) => deleteDictionary(id),
  onSuccess: () => {
    message.success('删除成功')
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

// Columns
const columns: DataTableColumns<Dictionary> = [
  { title: '字典名称', key: 'dictName' },
  { title: '字典编码', key: 'dictCode' },
  { title: '描述', key: 'description' },
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

      if (hasPermission('DICT_ITEM')) {
        actions.push(
          h(
            NButton,
            {
              type: 'info',
              text: true,
              size: 'small',
              onClick: () => openItems(row),
            },
            { icon: () => h('i', { class: 'pi pi-list' }), default: () => '字典项' },
          ),
        )
      }

      if (hasPermission('DICT_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => editDict(row),
            },
            { icon: () => h('i', { class: 'pi pi-pencil' }) },
          ),
        )
      }

      if (hasPermission('DICT_DELETE')) {
        actions.push(
          h(
            NButton,
            {
              type: 'error',
              text: true,
              size: 'small',
              onClick: () => confirmDeleteDict(row),
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
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.dictName = ''
  searchForm.dictCode = ''
  searchForm.status = undefined
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openNew = () => {
  dialogRef.value?.open()
}

const editDict = (dict: Dictionary) => {
  dialogRef.value?.open(dict.id)
}

const confirmDeleteDict = (dict: Dictionary) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除字典 "${dict.dictName}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(dict.id)
    },
  })
}

const openItems = (dict: Dictionary) => {
  drawerRef.value?.open(dict.id)
}
</script>
