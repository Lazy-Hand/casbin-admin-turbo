<template>
  <div
    class="flex min-h-screen items-center justify-center bg-cover bg-center"
    :style="{ backgroundImage: `url(${loginBg})` }"
  >
    <!-- Overlay for better text contrast -->
    <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

    <div
      class="z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 dark:bg-gray-900/80 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:bg-white/90"
    >
      <div class="flex flex-col items-center mb-8">
        <!-- Logo placeholder -->
        <i class="pi pi-verified text-5xl mb-3 text-green-600"></i>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
          Garden Admin
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">Welcome back, please sign in</p>
      </div>

      <NForm ref="formRef" :model="formModel" :rules="rules" size="large" :show-label="false">
        <NFormItem path="username">
          <NInput
            v-model:value="formModel.username"
            placeholder="Enter your username"
            class="bg-white/50! focus:bg-white! dark:bg-gray-800/50! dark:focus:bg-gray-800!"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <i class="pi pi-user text-gray-400"></i>
            </template>
          </NInput>
        </NFormItem>

        <NFormItem path="password">
          <NInput
            v-model:value="formModel.password"
            type="password"
            show-password-on="click"
            placeholder="Enter your password"
            class="bg-white/50! focus:bg-white! dark:bg-gray-800/50! dark:focus:bg-gray-800!"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <i class="pi pi-lock text-gray-400"></i>
            </template>
          </NInput>
        </NFormItem>

        <div class="flex items-center justify-between mb-6">
          <NCheckbox v-model:checked="formModel.rememberMe">
            <span class="text-gray-600 dark:text-gray-400">Remember me</span>
          </NCheckbox>
          <a
            href="#"
            class="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >Forgot password?</a
          >
        </div>

        <NButton
          type="primary"
          class="w-full bg-green-600! border-none! hover:bg-green-700! shadow-lg! shadow-green-500/30! transition-all duration-300 transform hover:-translate-y-0.5"
          :loading="loading"
          @click="handleLogin"
          size="large"
          block
        >
          Sign In
        </NButton>

        <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <span>Don't have an account? </span>
          <a
            href="#"
            class="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >Create account</a
          >
        </div>
      </NForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NForm,
  NFormItem,
  NInput,
  NCheckbox,
  NButton,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import loginBg from '@/assets/images/login-bg.png'
import { useUserStore } from '@/stores/user'

defineOptions({
  name: 'LoginPage',
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formModel = reactive({
  username: 'admin',
  password: 'admin123456',
  rememberMe: false,
})

const rules: FormRules = {
  username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
}

const handleLogin = async () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      try {
        const success = await userStore.handleLogin({
          username: formModel.username,
          password: formModel.password,
        })

        if (success) {
          const redirect = route.query.redirect as string
          router.push(redirect || '/')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* Naive UI overrides if necessary */
</style>
