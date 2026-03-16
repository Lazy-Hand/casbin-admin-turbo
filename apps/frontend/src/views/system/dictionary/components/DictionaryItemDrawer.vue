<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { type DictionaryItem, getDictionaryItemList, deleteDictionaryItem } from '@/api/dictionary'
import { usePermission } from '@/composables/usePermission'
import { useDialog, useMessage, type DataTableColumns } from 'naive-ui'
import { NDrawer, NDrawerContent, NButton, NDataTable, NSpace } from 'naive-ui'
import DictTag from '@/components/Dict/DictTag.vue'
import DictionaryItemDialog from './DictionaryItemDialog.vue'

const message = useMessage()
const dialog = useDialog()
const { hasPermission } = usePermission()

const show = ref(false)
const currentDictId = ref<number>()

const columns: DataTableColumns<DictionaryItem> = [
  { title: '标签', key: 'label', sorter: 'default' },
  { title: '值', key: 'value', sorter: 'default' },
  { title: '颜色类型', key: 'colorType', sorter: 'default' },
  { title: '排序', key: 'sort', sorter: 'default' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(DictTag, { value: row.status, dictCode: 'BASE_STATUS' })
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      const actions = []

      if (hasPermission('DICT_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              circle: true,
              quaternary: true,
              onClick: () => editItem(row),
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
              size: 'small',
              circle: true,
              quaternary: true,
              type: 'error',
              onClick: () => confirmDeleteItem(row),
            },
            { icon: () => h('i', { class: 'pi pi-trash' }) },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const { data, isLoading, refetch } = useQuery({
  key: ['dictItems', () => currentDictId.value],
  query: () => getDictionaryItemList(currentDictId.value!),
  enabled: () => !!show.value && !!currentDictId.value,
})

const items = computed(() => data.value?.data || [])

const deleteMutation = useMutation({
  mutation: (id: number) => deleteDictionaryItem(id),
  onSuccess: () => {
    message.success('删除成功')
    refetch()
  },
})

const open = (dictId: number) => {
  currentDictId.value = dictId
  show.value = true
}

const close = () => {
  show.value = false
}

const confirmDeleteItem = (item: DictionaryItem) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除字典项 "${item.label}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(item.id)
    },
  })
}

const itemDialogRef = ref()

const handleItemSuccess = () => {
  refetch()
}

const openNew = () => {
  itemDialogRef.value?.open(undefined, currentDictId.value)
}

const editItem = (item: DictionaryItem) => {
  itemDialogRef.value?.open(item)
}

const getRowKey = (row: DictionaryItem) => row.id

defineExpose({
  open,
  close,
})
</script>

<template>
  <NDrawer :show="show" @update:show="close" width="800" placement="right">
    <NDrawerContent title="字典项列表">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <NSpace>
            <NButton
              v-if="hasPermission('DICT_ADD')"
              type="primary"
              size="small"
              @click="openNew"
            >
              <template #icon>
                <i class="pi pi-plus" />
              </template>
              新增字典项
            </NButton>
          </NSpace>
        </div>
      </template>

      <NDataTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        :row-key="getRowKey"
        size="small"
      />
    </NDrawerContent>
  </NDrawer>

  <DictionaryItemDialog ref="itemDialogRef" @success="handleItemSuccess" />
</template>
