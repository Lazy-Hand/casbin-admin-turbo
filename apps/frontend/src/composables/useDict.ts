import { ref, computed } from 'vue'
import { useDictStore } from '@/stores/dictionary'

export function useDict(dictCode: string) {
  const store = useDictStore()
  const loading = ref(false)

  // Use computed to reactively get items from store
  const items = computed(() => store.dictMap[dictCode] || [])

  const load = async () => {
    // If already in store, we might not need to load, but store.getDict handles cache check
    loading.value = true
    try {
      await store.getDict(dictCode)
    } finally {
      loading.value = false
    }
  }

  // Helper to get label for a value
  const getLabel = (value: string | number) => {
    const item = items.value.find((i) => i.value == String(value))
    return item ? item.label : value
  }

  // Auto load
  load()

  return {
    items,
    loading,
    load,
    getLabel,
  }
}
