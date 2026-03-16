<script setup lang="ts">
import { ref } from 'vue'
import RichEditor from '@/components/RichEditor/RichEditor.vue'

defineOptions({
  name: 'DashboardMonitor',
})

const content = ref(
  '<p>欢迎使用富文本编辑器！</p><h2>功能特性</h2><ul><li>支持多种文本格式</li><li>支持插入图片</li><li>支持创建链接</li></ul>',
)
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-semibold mb-4">富文本编辑器示例</h1>
    <RichEditor v-model="content" placeholder="请输入内容..." />
    <div class="mt-4">
      <h3 class="text-sm font-medium mb-2">编辑器内容：</h3>
      <pre class="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">{{
        content
      }}</pre>
    </div>
  </div>
</template>

<style scoped></style>
