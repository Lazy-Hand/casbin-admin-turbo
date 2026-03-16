<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改岗位' : '新增岗位'"
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
      <NFormItem label="岗位名称" path="postName">
        <NInput v-model:value="formModel.postName" placeholder="请输入岗位名称" />
      </NFormItem>

      <NFormItem label="岗位编码" path="postCode">
        <NInput v-model:value="formModel.postCode" placeholder="请输入岗位编码" />
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formModel.sort" :min="0" placeholder="请输入排序" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictRadio dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>

      <NFormItem label="备注" path="remark">
        <NInput
          v-model:value="formModel.remark"
          type="textarea"
          placeholder="请输入备注"
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
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { createPost, updatePost, getPost, type PostParams } from '@/api/post'
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

const isEdit = computed(() => !!currentId.value)

const formModel = ref<PostParams>({
  postName: '',
  postCode: '',
  sort: 0,
  status: 1,
  remark: '',
})

const rules: FormRules = {
  postName: [{ required: true, message: '岗位名称不能为空', trigger: 'blur' }],
  postCode: [
    { required: true, message: '岗位编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
}

const open = async (id?: number) => {
  currentId.value = id
  show.value = true

  if (id) {
    loading.value = true
    try {
      const res = await getPost(id)
      formModel.value = {
        postName: res.data.postName,
        postCode: res.data.postCode,
        sort: res.data.sort,
        status: Number(res.data.status) as 0 | 1,
        remark: res.data.remark || '',
      }
    } catch (error) {
      console.error(error)
      message.error('获取岗位详情失败')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      postName: '',
      postCode: '',
      sort: 0,
      status: 1,
      remark: '',
    }
  }
}

const handleSave = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        if (isEdit.value) {
          await updatePost(currentId.value!, formModel.value)
          message.success('岗位更新成功')
        } else {
          await createPost(formModel.value)
          message.success('岗位创建成功')
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
