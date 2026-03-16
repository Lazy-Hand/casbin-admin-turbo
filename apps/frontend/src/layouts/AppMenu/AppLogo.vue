<template>
  <div
    class="app-logo flex items-center justify-between h-full overflow-hidden whitespace-nowrap px-4"
  >
    <a href="/" class="flex items-center gap-2">
      <img
        v-show="!collapsed"
        src="@/assets/images/lazyhand-logo.png"
        alt="logo"
        class="w-48 transition-all duration-300"
      />
      <img
        v-show="collapsed"
        src="@/assets/images/logo.png"
        alt="logo"
        class="w-48 transition-all duration-300"
      />
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<style lang="scss" scoped>
.app-logo {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  .pin-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    color: var(--n-text-color-3);
    cursor: pointer;
    background: transparent;
    border: none;
    transition: color 0.2s;

    &:hover {
      color: var(--n-text-color-1);
    }

    &.is-pinned {
      color: var(--n-primary-color);
    }

    i {
      font-size: 1.25rem;
    }
  }
}
</style>
