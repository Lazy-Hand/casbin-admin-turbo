<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({
  name: 'IframePage',
})

const route = useRoute()
const loading = ref(true)
const url = ref('')

const initUrl = () => {
  if (route.meta?.frameUrl) {
    url.value = route.meta.frameUrl as string
    loading.value = true
  }
}

const onIframeLoad = () => {
  loading.value = false
}

onMounted(() => {
  initUrl()
})

watch(
  () => route.path,
  () => {
    initUrl()
  },
)
</script>

<template>
  <div class="iframe-container w-full h-full relative">
    <div
      v-if="loading"
      class="loading-overlay absolute inset-0 flex align-items-center justify-content-center bg-white z-5"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>
    <iframe v-if="url" :src="url" class="w-full h-full border-none" @load="onIframeLoad"></iframe>
    <div v-else class="flex align-items-center justify-content-center h-full">
      <p>No URL configured for this page.</p>
    </div>
  </div>
</template>

<style scoped>
.iframe-container {
  /* Ensure it takes full height of the content area if needed,
     though usually the parent layout handles sizing.
     Min-height ensures it's visible even if parent has no height constraint yet. */
  min-height: calc(100vh - 9rem);
}
</style>
