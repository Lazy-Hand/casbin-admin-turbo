<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改角色' : '新增角色'"
    preset="card"
    class="w-full md:w-150!"
    @update:show="close"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="角色名称" path="roleName">
        <NInput v-model:value="formModel.roleName" placeholder="Enter role name" />
      </NFormItem>

      <NFormItem label="角色编码" path="roleCode">
        <NInput v-model:value="formModel.roleCode" placeholder="Enter role code" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictRadio dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>

      <NFormItem label="数据范围" path="dataScope">
        <NSelect
          v-model:value="formModel.dataScope"
          :options="dataScopeOptions"
          placeholder="选择数据范围"
          @update:value="handleDataScopeChange"
        />
      </NFormItem>

      <NFormItem
        v-if="formModel.dataScope === DataScope.CUSTOM"
        label="自定义部门"
        path="customDepts"
      >
        <NTreeSelect
          v-model:value="formModel.customDepts"
          :options="deptTreeOptions"
          multiple
          checkable
          placeholder="选择自定义部门"
          key-field="id"
          label-field="name"
          children-field="children"
        />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formModel.description"
          type="textarea"
          placeholder="Enter description"
          :rows="3"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSave">确认</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTreeSelect,
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { createRole, updateRole, getRole, type RoleParams, DataScope } from '@/api/role'
import { getDeptTree, type Dept } from '@/api/dept'
import { useMessage } from 'naive-ui'
import DictRadio from '@/components/Dict/DictRadio.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)
const deptTreeOptions = ref<Dept[]>([])

const isEdit = computed(() => !!currentId.value)

const dataScopeOptions = [
  { label: '全部数据', value: DataScope.ALL },
  { label: '自定义部门', value: DataScope.CUSTOM },
  { label: '本部门', value: DataScope.DEPT },
  { label: '本部门及以下', value: DataScope.DEPT_AND_CHILD },
]

const formModel = ref<RoleParams>({
  roleName: '',
  roleCode: '',
  description: '',
  status: 1, // Default status
  dataScope: undefined,
  customDepts: [],
})

const rules: FormRules = {
  roleName: [{ required: true, message: 'Role name is required', trigger: 'blur' }],
  roleCode: [
    { required: true, message: 'Role code is required', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: 'Only letters, numbers, and underscores allowed',
      trigger: 'blur',
    },
  ],
  status: [{ type: 'number', required: true, message: 'Status is required', trigger: 'change' }],
}

const fetchDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptTreeOptions.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleDataScopeChange = () => {
  // Clear customDepts when dataScope changes away from CUSTOM
  if (formModel.value.dataScope !== DataScope.CUSTOM) {
    formModel.value.customDepts = []
  }
}

const open = async (id?: number) => {
  currentId.value = id
  show.value = true

  await fetchDeptTree()

  if (id) {
    loading.value = true
    try {
      const res = await getRole(id)
      // Ensure we map correctly
      formModel.value = {
        roleName: res.data.roleName,
        roleCode: res.data.roleCode,
        description: res.data.description,
        status: Number(res.data.status) as 0 | 1, // Ensure number and cast to union type
        dataScope: res.data.dataScope
          ? DataScope[res.data.dataScope as keyof typeof DataScope]
          : undefined,
        customDepts: res.data.customDepts || [],
      }
    } catch (error) {
      console.error(error)
      message.error('Failed to fetch role details')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      roleName: '',
      roleCode: '',
      description: '',
      status: 1,
      dataScope: undefined,
      customDepts: [],
    }
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        const payload = { ...formModel.value }
        if (isEdit.value) {
          await updateRole(currentId.value!, payload)
          message.success('Role updated successfully')
        } else {
          await createRole(payload)
          message.success('Role created successfully')
        }
        emit('success')
        close()
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
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
