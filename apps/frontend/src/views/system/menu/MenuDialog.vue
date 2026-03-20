<template>
  <NModal
    :show="show"
    :title="isEdit ? '修改菜单' : '新增菜单'"
    preset="card"
    class="w-full md:w-240!"
    @update:show="close"
  >
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="left"
      label-width="120"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="菜单类型" path="menuType">
        <DictRadioButton
          v-model:value="formModel.menuType"
          dictCode="MENU_TYPE"
          @update:value="menuTypeChange"
        />
      </NFormItem>

      <NFormItem label="父菜单" path="parentId">
        <NTreeSelect
          v-model:value="formModel.parentId"
          :options="menuTreeOptions"
          label-field="permName"
          key-field="id"
          placeholder="选择父菜单"
          clearable
        />
      </NFormItem>

      <NFormItem label="菜单名称" path="permName">
        <NInput v-model:value="formModel.permName" placeholder="输入菜单名称" />
      </NFormItem>

      <NFormItem label="菜单编码" path="permCode">
        <NInput v-model:value="formModel.permCode" placeholder="例如：System" />
      </NFormItem>

      <NFormItem label="图标" path="icon">
        <IconSelect v-model="formModel.icon" />
      </NFormItem>

      <NFormItem label="路由路径" path="path">
        <NInput
          v-model:value="formModel.path"
          :placeholder="
            formModel.menuType === 'link' ? '例如：https://example.com' : '例如：/system/user'
          "
        />
      </NFormItem>

      <NFormItem label="组件路径" path="component">
        <NInput
          v-model:value="formModel.component"
          :disabled="formModel.menuType === 'iframe'"
          placeholder="例如：/views/system/user/index.vue"
        />
      </NFormItem>

      <NFormItem label="排序顺序" path="sort">
        <NInputNumber v-model:value="formModel.sort" :min="0" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <DictSelect dictCode="BASE_STATUS" v-model:value="formModel.status" />
      </NFormItem>
      <div>
        <n-divider> 元数据 </n-divider>
        <!-- 是否缓存 -->
        <NFormItem label="是否缓存" path="cache">
          <DictRadio dictCode="YES_NO" v-model:value="formModel.cache" />
        </NFormItem>
        <!-- 是否隐藏 -->
        <NFormItem label="是否隐藏" path="hidden">
          <DictRadio dictCode="YES_NO" v-model:value="formModel.hidden" />
        </NFormItem>
        <!-- 外链地址 -->
        <NFormItem label="内链地址" path="frameUrl">
          <NInput
            v-model:value="formModel.frameUrl"
            placeholder="仅内链类型菜单使用，输入完整URL地址"
          />
        </NFormItem>
      </div>
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
  NTreeSelect,
  NInputNumber,
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  createMenu,
  updateMenu,
  getMenu,
  getMenuList,
  type MenuParams,
  type Menu,
} from '@/api/menu'
import { useMessage } from 'naive-ui'
import IconSelect from '@/components/Icon/IconSelect.vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)
const show = ref(false)
const currentId = ref<number>()
const defaultParentId = ref<number>()
const menuTreeOptions = ref<Menu[]>([])
const formRef = ref<FormInst | null>(null)

const isEdit = computed(() => !!currentId.value)

const formModel = ref<MenuParams>({
  permName: '',
  permCode: '',
  menuType: 'page', // Default
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1,
  parentId: undefined,
  resourceType: 'menu',
  cache: 1,
  hidden: 0,
  frameUrl: '',
})

const rules = computed<FormRules>(() => {
  return {
    permName: [
      {
        required: ['menu', 'page', 'link', 'iframe', 'window', 'group'].includes(
          formModel.value.menuType,
        ),
        message: 'Name is required',
        trigger: 'blur',
      },
    ],
    permCode: [
      {
        required: ['menu', 'page', 'link', 'iframe', 'window', 'group'].includes(
          formModel.value.menuType,
        ),
        message: '菜单编码不能为空',
        trigger: 'blur',
      },
    ],
    path: [
      {
        required: ['menu', 'page', 'link', 'iframe', 'window', 'group'].includes(
          formModel.value.menuType,
        ),
        message: '路由路径不能为空',
        trigger: 'blur',
      },
      {
        validator: (rule, value) => {
          if (formModel.value.menuType === 'link') {
            const httpRegex = /^https?:\/\/.+/i
            if (!httpRegex.test(value)) {
              return new Error('路径必须是有效的URL（例如：https://example.com）')
            }
          }
          return true
        },
        trigger: 'blur',
      },
    ],
    component: [
      {
        required: ['page', 'link', 'iframe', 'window'].includes(formModel.value.menuType),
        message: 'Component is required for Menu types',
        trigger: 'blur',
      },
    ],
    frameUrl: [
      {
        required: formModel.value.menuType === 'iframe',
        message: '内链地址不能为空',
        trigger: 'blur',
      },
      {
        validator: (rule, value) => {
          if (formModel.value.menuType === 'iframe' && value) {
            const httpRegex = /^https?:\/\/.+/i
            if (!httpRegex.test(value)) {
              return new Error('内链地址必须是有效的URL（例如：https://example.com）')
            }
          }
          return true
        },
        trigger: 'blur',
      },
    ],
    menuType: [{ required: true, message: 'Type is required', trigger: 'change' }],
  }
})
const menuTypeChange = (val: string | number | undefined) => {
  if (val === 'iframe') {
    formModel.value.component = 'iframe/index'
  } else {
    formModel.value.component = ''
  }
}

const processMenuTree = (menus: Menu[]): Menu[] => {
  return menus.map((menu) => ({
    ...menu,
    permName: menu.menuType === 'divider' ? '分割线' : menu.permName,
    disabled: menu.menuType !== 'menu' && menu.menuType !== 'group',
    children: menu.children ? processMenuTree(menu.children) : undefined,
  }))
}

const fetchMenuTree = async () => {
  try {
    const res = await getMenuList({})
    menuTreeOptions.value = processMenuTree(res.data || [])
  } catch (e) {
    console.error(e)
  }
}

const open = async (id?: number, parentId?: number) => {
  currentId.value = id
  defaultParentId.value = parentId
  show.value = true

  await fetchMenuTree()

  if (id) {
    loading.value = true
    try {
      const res = await getMenu(id)
      const data = res.data
      formModel.value = {
        permName: data.permName,
        permCode: data.permCode,
        menuType: data.menuType,
        path: data.path,
        component: data.component,
        icon: data.icon,
        sort: data.sort,
        status: data.status,
        parentId: data.parentId ?? undefined,
        resourceType: data.resourceType,
        cache: data.cache,
        hidden: data.hidden,
        frameUrl: data.frameUrl,
      }
    } catch (error) {
      console.error(error)
      message.error('Failed to fetch details')
      close()
    } finally {
      loading.value = false
    }
  } else {
    formModel.value = {
      permName: '',
      permCode: '',
      menuType: 'page',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      status: 1,
      parentId: parentId ?? undefined,
      resourceType: 'menu',
      cache: 1,
      hidden: 0,
      frameUrl: '',
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
          await updateMenu(currentId.value!, payload)
          message.success('Updated successfully')
        } else {
          await createMenu(payload)
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
