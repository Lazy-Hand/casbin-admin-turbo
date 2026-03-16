<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改用户' : '创建用户'"
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
      <NFormItem label="头像">
        <ImageUpload
          v-model:value="avatarData"
          :business-id="1"
          business-type="demo"
          :max-size="2"
        />
      </NFormItem>
      <NFormItem label="用户名" path="username">
        <NInput
          v-model:value="formModel.username"
          placeholder="Enter username"
          :disabled="isEdit"
        />
      </NFormItem>

      <NFormItem label="昵称" path="nickname">
        <NInput v-model:value="formModel.nickname" placeholder="Enter nickname" />
      </NFormItem>

      <NFormItem label="密码" path="password" v-if="!isEdit">
        <NInput
          v-model:value="formModel.password"
          type="password"
          show-password-on="click"
          placeholder="Enter password"
        />
      </NFormItem>

      <NFormItem label="邮箱" path="email">
        <NInput v-model:value="formModel.email" placeholder="Enter email" />
      </NFormItem>

      <NFormItem label="手机号" path="mobile">
        <NInput v-model:value="formModel.mobile" placeholder="Enter mobile" />
      </NFormItem>

      <NFormItem label="角色" path="roles">
        <NSelect
          v-model:value="formModel.roles"
          multiple
          :options="roleOptions"
          placeholder="Select roles"
        />
      </NFormItem>

      <NFormItem label="部门" path="deptId">
        <NTreeSelect
          v-model:value="formModel.deptId"
          :options="deptOptions"
          placeholder="选择部门"
          clearable
          key-field="id"
          label-field="name"
          children-field="children"
        />
      </NFormItem>

      <NFormItem label="岗位" path="postId">
        <NSelect
          v-model:value="formModel.postId"
          :options="postOptions"
          placeholder="选择岗位"
          clearable
        />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictSelect dictCode="BASE_STATUS" v-model:value="formModel.status" />
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
import { createUser, updateUser, getUser, type UserParams } from '@/api/user'
import { getRoleOptions } from '@/api/role'
import { getPostOptions } from '@/api/post'
import { getDeptTree, type Dept } from '@/api/dept'
import { useMessage } from 'naive-ui'
import type { FileEntity } from '@/api/file'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const formRef = ref<FormInst | null>(null)
const roleOptions = ref<{ label: string; value: number }[]>([])
const postOptions = ref<{ label: string; value: number }[]>([])
const deptOptions = ref<Dept[]>([])
const avatarData = ref<Partial<FileEntity>>({})
const isEdit = computed(() => !!currentId.value)

const formModel = ref<UserParams>({
  username: '',
  nickname: '',
  password: '',
  email: '',
  mobile: '',
  status: 1,
  roles: [],
  deptId: null,
  postId: null,
  avatar: '',
})

const rules = computed<FormRules>(() => {
  return {
    username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
    nickname: [{ required: true, message: 'Nickname is required', trigger: 'blur' }],
    password: [{ required: !isEdit.value, message: 'Password is required', trigger: 'blur' }],
    roles: [
      {
        type: 'array',
        required: true,
        message: 'At least one role is required',
        trigger: 'change',
      },
    ],
  }
})

const fetchRoles = async () => {
  try {
    const res = await getRoleOptions()
    if (res.data?.length) {
      roleOptions.value = res.data.map((role) => ({
        label: role.roleName,
        value: role.id,
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchPosts = async () => {
  try {
    const res = await getPostOptions()
    if (res.data?.length) {
      postOptions.value = res.data.map((post) => ({
        label: post.postName,
        value: post.id,
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchDeptTree = async () => {
  try {
    const res = await getDeptTree()
    deptOptions.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const open = async (id?: number) => {
  currentId.value = id
  show.value = true

  await fetchRoles()
  await fetchPosts()
  await fetchDeptTree()

  if (id) {
    loading.value = true
    try {
      const res = await getUser(id)
      const data = res.data
      formModel.value = {
        username: data.username,
        nickname: data.nickname,
        password: '', // Password usually not returned
        email: data.email,
        mobile: data.mobile,
        status: data.status,
        roles: data.roles?.map((item) => item.id),
        deptId: data.deptId,
        postId: data.postId,
        avatar: data.avatar,
      }
      // 赋新对象才能触发 ImageUpload 的 watch，原地改 .url 不会触发
      avatarData.value = data.avatar ? { url: data.avatar } : {}
    } catch (error) {
      console.error(error)
      message.error('Failed to fetch details')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      username: '',
      nickname: '',
      password: '',
      email: '',
      mobile: '',
      status: 1,
      roles: [],
      deptId: null,
      postId: null,
      avatar: '',
    }
    avatarData.value = {}
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        const payload = { ...formModel.value, avatar: avatarData.value?.url }
        if (isEdit.value) {
          delete payload.password // Don't send empty password on update if not changed (simplified logic)
        }

        if (isEdit.value) {
          await updateUser(currentId.value!, payload)
          message.success('Updated successfully')
        } else {
          await createUser(payload)
          message.success('Created successfully')
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
