<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="岗位名称" path="postName">
          <NInput v-model:value="searchForm.postName" placeholder="Enter post name" />
        </NFormItem>
        <NFormItem label="岗位编码" path="postCode">
          <NInput v-model:value="searchForm.postCode" placeholder="Enter post code" />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <DictSelect
            dictCode="BASE_STATUS"
            v-model:value="searchForm.status"
            class="w-48"
            clearable
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
        <NSpace>
          <NButton type="primary" size="small" @click="openDrawer()" v-permission="['POST_ADD']">
            <template #icon>
              <i class="pi pi-plus" />
            </template>
            新增岗位
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="postList"
        :loading="isLoading"
        :pagination="pagination"
        remote
        :row-key="(row) => row.id"
      />
    </NCard>

    <PostDialog ref="dialogRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getPostPage, deletePost, type Post } from '@/api/post'
import PostDialog from './PostDialog.vue'
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
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemPost',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()

const searchForm = reactive({
  postName: '',
  postCode: '',
  status: undefined as 0 | 1 | undefined,
  pageNo: 1,
  pageSize: 10,
})
const createQueryState = () => ({ ...searchForm })
const queryState = ref(createQueryState())

const { data, isLoading, refetch } = useQuery({
  key: () => ['posts', queryState.value],
  query: () => getPostPage(queryState.value),
})

const postList = computed(() => data.value?.data?.list || [])
const total = computed(() => data.value?.data?.total || 0)
const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response as { data?: { message?: string } } | undefined
    return response?.data?.message || '删除失败'
  }

  return '删除失败'
}

const deleteMutation = useMutation({
  mutation: (id: number) => deletePost(id),
  onSuccess: () => {
    message.success('岗位删除成功')
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

const columns: DataTableColumns<Post> = [
  { title: '岗位名称', key: 'postName' },
  { title: '岗位编码', key: 'postCode' },
  { title: '排序', key: 'sort' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
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

      if (hasPermission('POST_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openDrawer(row.id),
            },
            { icon: () => h('i', { class: 'pi pi-pencil' }) },
          ),
        )
      }

      if (hasPermission('POST_DELETE')) {
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
  searchForm.pageNo = 1
  pagination.page = 1
  queryState.value = createQueryState()
}

const handleReset = () => {
  searchForm.postName = ''
  searchForm.postCode = ''
  searchForm.status = undefined
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  queryState.value = createQueryState()
}

const openDrawer = (id?: number) => {
  dialogRef.value?.open(id)
}

const confirmDelete = (post: Post) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除岗位"${post.postName}"吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(post.id)
    },
  })
}
</script>
