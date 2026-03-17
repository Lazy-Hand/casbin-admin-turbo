<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="文件类型" path="fileType">
          <NInput v-model:value="searchForm.fileType" placeholder="输入文件类型" />
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
      <NDataTable
        :columns="columns"
        :data="fileList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="getRowKey"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { getFileList, type FileEntity, type FileSearchParams } from '@/api/file'
import { NTag, type DataTableColumns, type PaginationProps } from 'naive-ui'

defineOptions({
  name: 'SystemFile',
})

const searchForm = reactive<FileSearchParams>({
  fileType: '',
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const { data, isLoading } = useQuery({
  key: () => ['files', queryState.value],
  query: () => getFileList(queryState.value),
})

const fileList = computed(() => data.value?.data.list || [])
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

// Format file size to human readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const columns: DataTableColumns<FileEntity> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '文件名', key: 'filename' },
  {
    title: '原始名称',
    key: 'originalName',
    ellipsis: { tooltip: true },
  },
  {
    title: '大小',
    key: 'size',
    render(row) {
      return formatFileSize(row.size)
    },
  },
  { title: '类型', key: 'mimetype' },
  {
    title: '文件类型',
    key: 'fileType',
    render(row) {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.fileType || '-' })
    },
  },
  {
    title: '公开',
    key: 'isPublic',
    render(row) {
      const type = row.isPublic ? 'success' : 'default'
      const label = row.isPublic ? '是' : '否'
      return h(NTag, { type, size: 'small' }, { default: () => label })
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      return row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'
    },
  },
]

const getRowKey = (row: FileEntity) => row.id

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.fileType = ''
  searchForm.isPublic = undefined
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}
</script>
