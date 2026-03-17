<template>
  <NModal
    :show="show"
    :title="dialogTitle"
    preset="card"
    class="w-full md:w-220!"
    @update:show="close"
  >
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="按钮名称" path="permName">
          <NInput v-model:value="searchForm.permName" placeholder="输入按钮名称" />
        </NFormItem>
        <NFormItem label="按钮编码" path="permCode">
          <NInput v-model:value="searchForm.permCode" placeholder="输入按钮编码" />
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
        <NButton
          v-if="hasPermission('MENU_ADD')"
          type="primary"
          size="small"
          @click="openButtonForm()"
        >
          <template #icon>
            <AppIcon icon="antd:PlusOutlined" />
          </template>
          新增按钮
        </NButton>
      </div>

      <NDataTable
        size="small"
        :columns="columns"
        :data="buttonList"
        :loading="loading"
        :pagination="pagination"
        remote
        :row-key="getRowKey"
      />
    </NCard>

    <ButtonFormDialog ref="buttonFormDialogRef" @success="handleFormSuccess" />

    <template #footer>
      <div class="flex justify-end">
        <NButton @click="close">关闭</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  useDialog,
  useMessage,
  type DataTableColumns,
  type PaginationProps,
} from 'naive-ui'
import { deleteMenu, getButtonPermissionPage, type Menu } from '@/api/menu'
import { usePermission } from '@/composables/usePermission'
import DictTag from '@/components/Dict/DictTag.vue'
import DynamicIcon from '@/components/Icon/DynamicIcon.vue'
import ButtonFormDialog from './ButtonFormDialog.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const dialog = useDialog()
const { hasPermission } = usePermission()

const show = ref(false)
const loading = ref(false)
const parentId = ref<number>()
const parentName = ref('')
const buttonList = ref<Menu[]>([])
const total = ref(0)
const buttonFormDialogRef = ref()

const searchForm = reactive({
  permName: '',
  permCode: '',
  pageNo: 1,
  pageSize: 10,
})

const dialogTitle = computed(() =>
  parentName.value ? `按钮管理 - ${parentName.value}` : '按钮管理',
)

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
    fetchList()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    searchForm.pageSize = pageSize
    searchForm.pageNo = 1
    fetchList()
  },
})

const columns: DataTableColumns<Menu> = [
  { title: '按钮名称', key: 'permName' },
  { title: '按钮编码', key: 'permCode' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  { title: '排序', key: 'sort', width: 80 },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      const createdAt = row.createdAt || row.createTime
      return createdAt ? dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row) {
      const actions = []

      if (hasPermission('MENU_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openButtonForm(row.id),
            },
            { icon: () => h(DynamicIcon, { icon: 'antd:EditOutlined' }) },
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
            { icon: () => h(DynamicIcon, { icon: 'antd:DeleteOutlined' }) },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const getRowKey = (row: Menu) => row.id

const fetchList = async () => {
  if (!parentId.value) return
  loading.value = true
  try {
    const res = await getButtonPermissionPage({
      parentId: parentId.value,
      pageNo: searchForm.pageNo,
      pageSize: searchForm.pageSize,
      permName: searchForm.permName || undefined,
      permCode: searchForm.permCode || undefined,
    })
    buttonList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const open = async (menuId: number, menuName: string) => {
  parentId.value = menuId
  parentName.value = menuName
  searchForm.permName = ''
  searchForm.permCode = ''
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  show.value = true
  await fetchList()
}

const openButtonForm = (id?: number) => {
  if (!parentId.value) return
  buttonFormDialogRef.value?.open(parentId.value, id)
}

const handleSearch = () => {
  searchForm.pageNo = 1
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  searchForm.permName = ''
  searchForm.permCode = ''
  searchForm.pageNo = 1
  searchForm.pageSize = 10
  pagination.page = 1
  pagination.pageSize = 10
  fetchList()
}

const handleFormSuccess = async () => {
  emit('success')
  await fetchList()
}

const confirmDelete = (menu: Menu) => {
  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete "${menu.permName}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await deleteMenu(menu.id)
        message.success('Button deleted')
        emit('success')
        await fetchList()
      } catch (error) {
        console.error(error)
      }
    },
  })
}

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
})
</script>
