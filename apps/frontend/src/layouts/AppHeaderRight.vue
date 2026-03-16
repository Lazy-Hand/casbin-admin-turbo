<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useLayout } from '@/layouts/composables/useLayout'
import { useI18n } from 'vue-i18n'
import { NButton, NDropdown, NAvatar, NIcon, type DropdownOption } from 'naive-ui'

defineOptions({
  name: 'AppHeaderRight',
})

const userStore = useUserStore()
const { toggleDarkMode, isDarkTheme } = useLayout()
const { locale } = useI18n()

const renderIcon = (iconClass: string) => () =>
  h(NIcon, null, { default: () => h('i', { class: iconClass }) })

// Language Dropdown
const languageOptions: DropdownOption[] = [
  { label: '简体中文', key: 'zh-CN' },
  { label: 'English', key: 'en-US' },
  { label: 'System', key: 'system' },
]

const handleLanguageSelect = (key: string) => {
  if (key === 'system') {
    const sysLang = navigator.language
    locale.value = sysLang.startsWith('zh') ? 'zh-CN' : 'en-US'
  } else {
    locale.value = key
  }
}

// User Dropdown
const userOptions: DropdownOption[] = [
  {
    label: 'Profile',
    key: 'profile',
    icon: renderIcon('pi pi-user'),
  },
  { type: 'divider', key: 'd1' },
  {
    label: 'Sign Out',
    key: 'logout',
    icon: renderIcon('pi pi-sign-out'),
  },
]

const handleUserSelect = (key: string) => {
  if (key === 'logout') {
    window.$dialog.warning({
      title: 'Sign Out',
      content: 'Are you sure you want to sign out?',
      positiveText: 'Sign Out',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        userStore.handleLogout()
      },
    })
  } else if (key === 'profile') {
    console.log('Navigate to profile')
  }
}
</script>

<template>
  <div class="header-right flex items-center gap-4 mr-4">
    <NDropdown :options="languageOptions" @select="handleLanguageSelect">
      <NButton quaternary circle>
        <template #icon>
          <NIcon><i class="pi pi-language" /></NIcon>
        </template>
      </NButton>
    </NDropdown>

    <NButton quaternary circle @click="toggleDarkMode">
      <template #icon>
        <NIcon>
          <i :class="['pi', isDarkTheme ? 'pi-moon' : 'pi-sun']" />
        </NIcon>
      </template>
    </NButton>

    <NDropdown :options="userOptions" @select="handleUserSelect">
      <div
        class="user-profile flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
      >
        <NAvatar round size="small" class="mr-2"> U </NAvatar>
        <span class="username hidden md:inline-block font-medium text-gray-700 dark:text-gray-200"
          >Admin User</span
        >
        <NIcon class="ml-2"><i class="pi pi-angle-down" /></NIcon>
      </div>
    </NDropdown>
  </div>
</template>

<style scoped>
.layout-header-right {
  height: 100%;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
