<template>
  <div class="p-4 flex flex-col gap-4">
    <NCard title="Workbench">
      <template #header-extra>
        <div class="flex gap-2">
          <NButton @click="toggleDarkMode">
            <template #icon>
              <AppIcon icon="ionicons5:MoonOutline" />
            </template>
            Toggle Dark Mode
          </NButton>
          <NButton @click="testMessages">Test Message</NButton>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NCard title="Naive UI Component" hoverable>
          <p class="mb-4 text-gray-500">This card uses Naive UI components.</p>
          <NButton type="primary">Naive Button</NButton>
        </NCard>

        <NCard title="Another Component" hoverable>
          <p class="mb-4 text-gray-500">This area also uses Naive UI components.</p>
          <div class="flex gap-2">
            <NButton type="info">Info</NButton>
            <NButton type="success">Success</NButton>
            <NButton type="warning">Warning</NButton>
            <NButton type="error">Error</NButton>
          </div>
        </NCard>
        <NCard title="Upload Components Test" hoverable class="col-span-1 md:col-span-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="font-bold mb-2">Image Upload</h3>
              <ImageUpload
                v-model:value="testImageUrl"
                :business-id="1"
                business-type="demo"
                :max-size="2"
              />
              <p class="mt-2 text-sm text-gray-500 break-all">Image Data: {{ testImageUrl }}</p>
            </div>
            <div>
              <h3 class="font-bold mb-2">File Upload (with chunking > 1MB)</h3>
              <FileUpload
                v-model:value="testFileUrl"
                :business-id="2"
                business-type="demo"
                accept=".pdf,.zip,.txt,.png,.jpg"
                :max-size="50"
                :chunk-size="1"
              />
              <p class="mt-2 text-sm text-gray-500 break-all">File Data: {{ testFileUrl }}</p>
            </div>
            <div>
              <h3 class="font-bold mb-2 mt-4 md:mt-0">Multiple Image Upload</h3>
              <ImageUpload
                v-model:value="testMultiImageUrls"
                :business-id="3"
                business-type="demo"
                :max-size="2"
                :multiple="true"
                :max="5"
              />
              <p class="mt-2 text-sm text-gray-500 break-all">
                Image Datas: {{ testMultiImageUrls }}
              </p>
            </div>
            <div>
              <h3 class="font-bold mb-2 mt-4 md:mt-0">Multiple File Upload</h3>
              <FileUpload
                v-model:value="testMultiFileUrls"
                :business-id="4"
                business-type="demo"
                accept=".pdf,.zip,.txt,.png,.jpg"
                :max-size="50"
                :chunk-size="1"
                :multiple="true"
                :max="5"
              />
              <p class="mt-2 text-sm text-gray-500 break-all">
                File Datas: {{ testMultiFileUrls }}
              </p>
            </div>
          </div>
        </NCard>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { useMessage, NCard, NButton } from 'naive-ui'
import { useLayout } from '@/layouts/composables/useLayout'

defineOptions({
  name: 'DashboardWorkbench',
})

import { ref } from 'vue'
import { ImageUpload, FileUpload } from '@/components/Upload'

const testImageUrl = ref<any | null>(null)
const testFileUrl = ref<any | null>(null)
const testMultiImageUrls = ref<any[]>([])
const testMultiFileUrls = ref<any[]>([])

const message = useMessage()
const { toggleDarkMode } = useLayout()

const testMessages = () => {
  message.success('Test Success')
}
</script>

<style scoped></style>
