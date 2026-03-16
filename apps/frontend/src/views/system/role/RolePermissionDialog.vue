<template>
  <NModal
    :show="show"
    :title="dialogTitle"
    preset="card"
    class="w-full md:w-180!"
    @update:show="close"
  >
    <NSpin :show="loading">
      <NTree
        class="max-h-110 overflow-auto border border-gray-200 rounded p-3"
        :data="menuTree"
        checkable
        block-line
        default-expand-all
        key-field="id"
        label-field="permName"
        children-field="children"
        :render-label="renderTreeLabel"
        :checked-keys="checkedKeys"
        @update:checked-keys="handleCheckedKeysChange"
      />
    </NSpin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSave">保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NModal, NButton, NTree, NSpin, NTag, useMessage, type TreeOption } from 'naive-ui'
import { getMenuAndButtonPermissions, type PermissionTreeNode } from '@/api/permission'
import { assignRolePermissions, getRolePermissions } from '@/api/role'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()

const show = ref(false)
const loading = ref(false)
const submitting = ref(false)
const roleId = ref<number>()
const roleName = ref('')
const menuTree = ref<TreeOption[]>([])
const checkedKeys = ref<number[]>([])

const dialogTitle = computed(() =>
  roleName.value ? `分配菜单权限 - ${roleName.value}` : '分配菜单权限',
)

const normalizeMenuTree = (nodes: PermissionTreeNode[] = []): TreeOption[] => {
  return nodes.map((node) => ({
    id: node.id,
    permName: node.permName,
    resourceType: node.resourceType,
    menuType: node.menuType,
    children: normalizeMenuTree(node.children || []),
  }))
}

const renderTreeLabel = ({ option }: { option: TreeOption }) => {
  const isButton = option.resourceType === 'button'
  const menuType = String(option.menuType || '')
  const menuTypeLabelMap: Record<string, string> = {
    menu: '菜单夹',
    page: '页面',
    link: '外链',
    iframe: '内嵌',
    window: '新窗口',
    divider: '分割线',
    group: '分组',
  }
  const menuTypeTagTypeMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
    menu: 'success',
    page: 'info',
    link: 'primary',
    iframe: 'warning',
    window: 'primary',
    divider: 'default',
    group: 'success',
  }
  const menuTypeLabel = menuTypeLabelMap[menuType]
  const menuTypeTagType = menuTypeTagTypeMap[menuType] || 'default'

  return h('div', { class: 'flex items-center gap-2' }, [
    h('span', null, String(option.permName || '')),
    isButton
      ? h(
          NTag,
          { size: 'small', type: 'warning', bordered: false },
          { default: () => '按钮' },
        )
      : menuTypeLabel
        ? h(
            NTag,
            { size: 'small', type: menuTypeTagType, bordered: false },
            { default: () => menuTypeLabel },
          )
        : null,
  ])
}

const handleCheckedKeysChange = (keys: Array<string | number>) => {
  checkedKeys.value = keys.map((key) => Number(key))
}

const open = async (id: number, name?: string) => {
  roleId.value = id
  roleName.value = name || ''
  show.value = true
  loading.value = true

  try {
    const [permissionTreeRes, permissionRes] = await Promise.all([
      getMenuAndButtonPermissions({}),
      getRolePermissions(id),
    ])

    menuTree.value = normalizeMenuTree(permissionTreeRes.data || [])
    checkedKeys.value = ((permissionRes.data || []).map((item) => item.permissionId) as number[]).filter(
      (permissionId, index, list) => list.indexOf(permissionId) === index,
    )
  } catch (error) {
    console.error(error)
    message.error('加载角色权限失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!roleId.value) return
  if (checkedKeys.value.length === 0) {
    message.warning('请至少选择一个菜单权限')
    return
  }

  submitting.value = true
  try {
    await assignRolePermissions(roleId.value, checkedKeys.value)
    message.success('菜单权限分配成功')
    emit('success')
    close()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const close = () => {
  show.value = false
}

defineExpose({
  open,
  close,
})
</script>
