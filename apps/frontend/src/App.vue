<script setup lang="ts">
import AppMain from './AppMain.vue'
import NaiveProvider from './components/Naive/NaiveProvider.vue'
import AppLoading from './components/Naive/AppLoading.vue'
import { PiniaColadaDevtools } from '@pinia/colada-devtools'
// 使用 Suspense 处理异步组件加载
</script>

<template>
  <NaiveProvider>
    <Suspense>
      <!-- 异步组件 -->
      <AppMain />

      <!-- 加载状态 -->
      <template #fallback>
        <AppLoading />
      </template>
    </Suspense>
  </NaiveProvider>
  <PiniaColadaDevtools />
</template>
