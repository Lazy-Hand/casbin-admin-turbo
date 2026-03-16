<template>
  <div class="cron-field-config">
    <NRadioGroup v-model:value="currentType" size="small" class="mb-3">
      <NSpace vertical>
        <NRadio value="every">每一{{ unit }}</NRadio>
        <NRadio v-if="allowUnspec" value="unspec">不指定</NRadio>
        <NRadio value="range">周期</NRadio>
        <NRadio value="loop">从{{ unit }}开始</NRadio>
        <NRadio value="specific">指定</NRadio>
      </NSpace>
    </NRadioGroup>

    <!-- 周期配置 -->
    <div v-if="currentType === 'range'" class="config-panel">
      <NSpace align="center">
        <span>从</span>
        <NInputNumber
          v-model:value="rangeStart"
          :min="min"
          :max="max"
          size="small"
          style="width: 100px"
        />
        <span>-</span>
        <NInputNumber
          v-model:value="rangeEnd"
          :min="min"
          :max="max"
          size="small"
          style="width: 100px"
        />
        <span>{{ unit }}</span>
      </NSpace>
    </div>

    <!-- 循环配置 -->
    <div v-if="currentType === 'loop'" class="config-panel">
      <NSpace align="center">
        <span>从</span>
        <NInputNumber
          v-model:value="loopStart"
          :min="min"
          :max="max"
          size="small"
          style="width: 100px"
        />
        <span>{{ unit }}开始，每</span>
        <NInputNumber
          v-model:value="loopStep"
          :min="1"
          :max="max"
          size="small"
          style="width: 80px"
        />
        <span>{{ unit }}执行一次</span>
      </NSpace>
    </div>

    <!-- 指定配置 -->
    <div v-if="currentType === 'specific'" class="config-panel">
      <div class="mb-2 text-sm text-gray-600">请选择{{ unit }}（可多选）：</div>
      <div v-if="unit === '周' && weekOptions" class="week-specific">
        <NCheckboxGroup v-model:value="specificValues">
          <NSpace>
            <NCheckbox
              v-for="opt in weekOptions"
              :key="opt.value"
              :value="parseInt(opt.value)"
              :label="opt.label"
            />
          </NSpace>
        </NCheckboxGroup>
      </div>
      <div v-else class="specific-grid">
        <NCheckboxGroup v-model:value="specificValues">
          <div class="grid-container">
            <NCheckbox
              v-for="i in displayRange"
              :key="i"
              :value="i"
              :label="i.toString()"
              class="checkbox-item"
            />
          </div>
        </NCheckboxGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NRadioGroup, NRadio, NInputNumber, NSpace, NCheckboxGroup, NCheckbox } from 'naive-ui'

interface FieldConfig {
  type: 'every' | 'unspec' | 'range' | 'loop' | 'specific'
  rangeStart?: number
  rangeEnd?: number
  loopStart?: number
  loopStep?: number
  specific?: number[]
}

interface Props {
  modelValue?: FieldConfig
  min: number
  max: number
  unit: string
  allowUnspec?: boolean
  weekOptions?: Array<{ label: string; value: string }>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ type: 'every' }),
  allowUnspec: false,
  weekOptions: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldConfig): void
  (e: 'update'): void
}>()

const currentType = computed({
  get: () => props.modelValue.type,
  set: (val) => {
    const newConfig: FieldConfig = { type: val }
    if (val === 'range') {
      newConfig.rangeStart = props.min
      newConfig.rangeEnd = props.min + 1
    } else if (val === 'loop') {
      newConfig.loopStart = props.min
      newConfig.loopStep = 1
    } else if (val === 'specific') {
      newConfig.specific = []
    }
    emit('update:modelValue', newConfig)
    emit('update')
  },
})

const rangeStart = computed({
  get: () => props.modelValue.rangeStart ?? props.min,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, rangeStart: val })
    emit('update')
  },
})

const rangeEnd = computed({
  get: () => props.modelValue.rangeEnd ?? props.min + 1,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, rangeEnd: val })
    emit('update')
  },
})

const loopStart = computed({
  get: () => props.modelValue.loopStart ?? props.min,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, loopStart: val })
    emit('update')
  },
})

const loopStep = computed({
  get: () => props.modelValue.loopStep ?? 1,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, loopStep: val })
    emit('update')
  },
})

const specificValues = computed({
  get: () => props.modelValue.specific ?? [],
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, specific: val })
    emit('update')
  },
})

// 显示范围：如果范围太大，分段显示
const displayRange = computed(() => {
  if (props.max - props.min + 1 > 60) {
    // 超过60个，只显示一部分
    return Array.from({ length: 20 }, (_, i) => props.min + i)
  }
  return Array.from({ length: props.max - props.min + 1 }, (_, i) => props.min + i)
})
</script>

<style scoped>
.cron-field-config {
  padding: 12px 0;
}

.config-panel {
  padding: 12px;
  background-color: var(--n-color-modal);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}

.specific-grid {
  max-height: 200px;
  overflow-y: auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}

.checkbox-item {
  margin: 0;
}

.week-specific {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
