<template>
  <div class="p-4">
    <NCard class="mb-4">
      <NForm inline :model="searchForm" label-placement="left" size="small">
        <NFormItem label="部门名称" path="name">
          <NInput v-model:value="searchForm.name" placeholder="输入部门名称" />
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
          <NButton type="primary" size="small" @click="openDialog()" v-permission="['DEPT_ADD']">
            <template #icon>
              <AppIcon icon="antd:PlusOutlined" />
            </template>
            新增部门
          </NButton>
          <NButton type="info" size="small" @click="expandAll">
            <template #icon>
              <AppIcon icon="antd:DownOutlined" />
            </template>
            展开全部
          </NButton>
          <NButton type="info" size="small" @click="collapseAll">
            <template #icon>
              <AppIcon icon="antd:UpOutlined" />
            </template>
            折叠全部
          </NButton>
        </n-space>
      </div>

      <NDataTable
        :columns="columns"
        :data="deptTree"
        :loading="isLoading"
        :row-key="getRowKey"
        :pagination="false"
        :expandable="true"
        v-model:expanded-row-keys="expandedRowKeys"
      />
    </NCard>

    <DeptDialog ref="dialogRef" @success="refetch" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, reactive, computed, watch } from 'vue'
import { useQuery, useMutation } from '@pinia/colada'
import { getDeptTree, deleteDept, type Dept } from '@/api/dept'
import DeptDialog from './DeptDialog.vue'
import { useDialog, useMessage } from 'naive-ui'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDataTable,
  NTag,
  NSpace,
  type DataTableColumns,
} from 'naive-ui'
import { usePermission } from '@/composables/usePermission'

defineOptions({
  name: 'SystemDept',
})

const dialog = useDialog()
const message = useMessage()
const { hasPermission } = usePermission()

const dialogRef = ref()

const searchForm = reactive({
  name: '',
  status: undefined as number | undefined,
})

const { data, isLoading, refetch } = useQuery({
  key: () => ['dept-tree'],
  query: () => getDeptTree(),
})

const deptTree = computed(() => {
  const tree = data.value?.data || []
  // Apply filters
  let filtered = tree

  if (searchForm.name) {
    filtered = filterByName(filtered, searchForm.name)
  }

  if (searchForm.status !== undefined) {
    filtered = filterByStatus(filtered, searchForm.status)
  }

  return filtered
})

// Helper function to filter tree by name (recursive)
const filterByName = (deptList: Dept[], name: string): Dept[] => {
  const result: Dept[] = []
  for (const dept of deptList) {
    if (dept.name?.toLowerCase().includes(name.toLowerCase())) {
      result.push(dept)
    } else if (dept.children && dept.children.length > 0) {
      const filteredChildren = filterByName(dept.children, name)
      if (filteredChildren.length > 0) {
        result.push({ ...dept, children: filteredChildren })
      }
    }
  }
  return result
}

// Helper function to filter tree by status (recursive)
const filterByStatus = (deptList: Dept[], status: number): Dept[] => {
  const result: Dept[] = []
  for (const dept of deptList) {
    if (dept.status === status) {
      result.push(dept)
    } else if (dept.children && dept.children.length > 0) {
      const filteredChildren = filterByStatus(dept.children, status)
      if (filteredChildren.length > 0) {
        result.push({ ...dept, children: filteredChildren })
      }
    }
  }
  return result
}

const deleteMutation = useMutation({
  mutation: (id: number) => deleteDept(id),
  onSuccess: () => {
    message.success('删除成功')
    refetch()
  },
  onError: (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = error.response as { data?: { message?: string } } | undefined
      message.error(response?.data?.message || '删除失败')
      return
    }

    message.error('删除失败')
  },
})

const columns: DataTableColumns<Dept> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '部门名称', key: 'name', tree: true },
  {
    title: '负责人',
    key: 'leader',
    render(row) {
      return row.leader?.nickname || '-'
    },
  },
  {
    title: '排序',
    key: 'sort',
    width: 80,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.status === 1 ? 'success' : 'default', size: 'small' },
        { default: () => (row.status === 1 ? '正常' : '停用') },
      )
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row) {
      return row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      const actions = []

      if (hasPermission('DEPT_EDIT')) {
        actions.push(
          h(
            NButton,
            {
              type: 'info',
              text: true,
              size: 'small',
              onClick: () => openDialog(row.id),
            },
            { default: () => '编辑' },
          ),
        )
      }

      if (hasPermission('DEPT_ADD')) {
        actions.push(
          h(
            NButton,
            {
              type: 'success',
              text: true,
              size: 'small',
              onClick: () => openDialog(undefined, row.id),
            },
            { default: () => '新增下级' },
          ),
        )
      }

      if (hasPermission('DEPT_DELETE')) {
        actions.push(
          h(
            NButton,
            {
              type: 'error',
              text: true,
              size: 'small',
              onClick: () => confirmDelete(row),
            },
            { default: () => '删除' },
          ),
        )
      }

      return h('div', { class: 'flex gap-2' }, actions)
    },
  },
]

const getRowKey = (row: Dept) => row.id

const handleSearch = () => {
  // Filtering is reactive through computed
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = undefined
}

const openDialog = (id?: number, parentId?: number | null) => {
  dialogRef.value?.open(id, parentId)
}

const confirmDelete = (dept: Dept) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除部门 "${dept.name}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMutation.mutate(dept.id)
    },
  })
}

const extractAllRowKeys = (tree: Dept[]): number[] => {
  const keys: number[] = []
  const dfs = (nodes: Dept[]) => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        keys.push(node.id)
        dfs(node.children)
      }
    }
  }
  dfs(tree)
  return keys
}

const expandedRowKeys = ref<number[]>([])

watch(
  deptTree,
  (newTree) => {
    expandedRowKeys.value = extractAllRowKeys(newTree)
  },
  { immediate: true },
)

const expandAll = () => {
  expandedRowKeys.value = extractAllRowKeys(deptTree.value)
}

const collapseAll = () => {
  expandedRowKeys.value = []
}
</script>
