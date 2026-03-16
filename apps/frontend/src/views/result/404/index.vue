<template>
  <div class="h-full flex items-center justify-center">
    <div class="text-center">
      <div class="text-6xl font-bold text-gray-300 mb-4">404</div>
      <div class="text-xl text-gray-500 mb-8">页面不存在</div>
      <n-button type="primary" @click="goBack">返回</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>
