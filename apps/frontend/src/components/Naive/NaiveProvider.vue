<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  NModalProvider,
  useMessage,
  useDialog,
  useNotification,
  useLoadingBar,
  zhCN,
  dateZhCN,
  darkTheme,
} from 'naive-ui'
import { computed, defineComponent } from 'vue'
import { useLayout } from '@/layouts/composables/useLayout'

defineOptions({
  name: 'NaiveProvider',
})

const { isDarkTheme } = useLayout()

const theme = computed(() => (isDarkTheme.value ? darkTheme : null))

const ContextHolder = defineComponent({
  name: 'ContextHolder',
  setup() {
    window.$message = useMessage()
    window.$dialog = useDialog()
    window.$notification = useNotification()
    window.$loading = useLoadingBar()
    return () => null
  },
})
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme="theme">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NNotificationProvider>
            <NModalProvider>
              <ContextHolder />
              <slot></slot>
            </NModalProvider>
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
