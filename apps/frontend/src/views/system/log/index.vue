<template>
  <div class="p-4">
    <NCard>
      <NTabs type="line" animated>
        <NTabPane name="operation" tab="操作日志">
          <OperationLogTab />
        </NTabPane>
        <NTabPane name="login" tab="登录日志">
          <LoginLogTab />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import OperationLogTab from './OperationLogTab.vue'
import LoginLogTab from './LoginLogTab.vue'

defineOptions({
  name: 'SystemLog',
})
</script>
