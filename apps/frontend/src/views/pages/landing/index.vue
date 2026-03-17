<script setup lang="ts">
import { NButton } from 'naive-ui'

defineOptions({
  name: 'LandingPage',
})
// Simple landing page logic
</script>

<template>
  <div
    class="landing-body flex flex-column align-items-center justify-content-center min-h-screen surface-ground"
  >
    <div class="surface-card p-6 shadow-2 border-round text-center" style="max-width: 600px">
      <div class="text-blue-600 font-bold mb-3">
        <AppIcon icon="ionicons5:LogoDiscord" class="text-4xl" />
      </div>
      <div class="text-900 font-bold text-4xl mb-3">Welcome to Landing Page</div>
      <p class="text-700 text-lg mb-5 line-height-3">
        This is an example of a standalone page without the application layout. It opens in a new
        tab directly from the main menu.
      </p>
      <div class="flex justify-content-center gap-3">
        <NButton type="primary">
          <template #icon>
            <AppIcon icon="antd:ArrowRightOutlined" />
          </template>
          Get Started
        </NButton>
        <NButton secondary strong>
          <template #icon>
            <AppIcon icon="antd:InfoCircleOutlined" />
          </template>
          Learn More
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-body {
  background: var(--surface-ground);
}
</style>
