<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改部门' : '创建部门'"
    preset="card"
    class="w-full md:w-250!"
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
      <NFormItem label="上级部门" path="parentId">
        <NTreeSelect
          v-model:value="formModel.parentId"
          :options="deptTreeOptions"
          placeholder="选择上级部门（不选则为顶级部门）"
          clearable
          key-field="id"
          label-field="name"
          children-field="children"
        />
      </NFormItem>

      <NFormItem label="部门名称" path="name">
        <NInput v-model:value="formModel.name" placeholder="输入部门名称" />
      </NFormItem>

      <NFormItem label="负责人" path="leaderId">
        <NSelect
          v-model:value="formModel.leaderId"
          :options="userOptions"
          placeholder="选择负责人"
          clearable
          filterable
          label-field="label"
          value-field="value"
        />
      </NFormItem>

      <NFormItem label="显示排序" path="sort">
        <NInputNumber
          v-model:value="formModel.sort"
          placeholder="输入排序号"
          :min="0"
          class="w-full"
        />
      </NFormItem>

      <NFormItem label="部门状态" path="status">
        <DictSelect dict-code="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>

      <NFormItem label="备注" path="remark">
        <NInput
          v-model:value="formModel.remark"
          type="textarea"
          placeholder="输入备注信息"
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
  NInputNumber,
  NSelect,
  NTreeSelect,
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { createDept, updateDept, getDeptDetail, type DeptFormData } from '@/api/dept'
import { getDeptTree, type Dept } from '@/api/dept'
import { getAllUsers, type User } from '@/api/user'
import { useMessage } from 'naive-ui'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)
const deptTreeOptions = ref<Dept[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])
const isEdit = computed(() => !!currentId.value)
const initialFormModel = (): DeptFormData => ({
  name: '',
  parentId: null,
  leaderId: null,
  status: 1,
  sort: 0,
  remark: '',
})

const formModel = ref<DeptFormData>(initialFormModel())

const rules = computed<FormRules>(() => {
  return {
    name: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
  }
})

const fetchDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptTreeOptions.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const fetchUsers = async () => {
  try {
    const res = await getAllUsers()
    if (res.data) {
      userOptions.value = res.data.map((user: User) => ({
        label: `${user.nickname} (${user.username})`,
        value: user.id,
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

const open = async (id?: number, parentId?: number | null) => {
  currentId.value = id
  show.value = true

  await fetchDeptTree()
  await fetchUsers()

  if (id) {
    loading.value = true
    try {
      const res = await getDeptDetail(id)
      const data = res.data
      formModel.value = {
        name: data.name,
        parentId: data.parentId || null,
        leaderId: data.leaderId || null,
        status: data.status,
        sort: data.sort,
        remark: data.remark || '',
      }
    } catch (error) {
      console.error(error)
      message.error('获取部门详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      ...initialFormModel(),
      parentId: parentId ?? null,
    }
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (isEdit.value) {
          await updateDept(currentId.value!, formModel.value)
          message.success('更新成功')
        } else {
          await createDept(formModel.value)
          message.success('创建成功')
        }
        emit('success')
        close()
      } catch (error: unknown) {
        console.error(error)
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const response = error.response as { data?: { message?: string } } | undefined
          message.error(response?.data?.message || '操作失败')
        } else {
          message.error('操作失败')
        }
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
