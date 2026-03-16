<script setup lang="ts">
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
      <div class="text-blue-600 font-bold mb-3"><i class="pi pi-discord text-4xl"></i></div>
      <div class="text-900 font-bold text-4xl mb-3">Welcome to Landing Page</div>
      <p class="text-700 text-lg mb-5 line-height-3">
        This is an example of a standalone page without the application layout. It opens in a new
        tab directly from the main menu.
      </p>
      <div class="flex justify-content-center gap-3">
        <Button label="Get Started" icon="pi pi-arrow-right" />
        <Button label="Learn More" icon="pi pi-info-circle" severity="secondary" outlined />
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-body {
  background: var(--surface-ground);
}
</style>
