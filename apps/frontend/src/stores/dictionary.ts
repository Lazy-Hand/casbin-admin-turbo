import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDictionaryItemListByCode, type DictionaryItem } from '@/api/dictionary'

export const useDictStore = defineStore('dictionary', () => {
  const dictMap = ref<Record<string, DictionaryItem[]>>({})
  const pendingRequests = ref<Record<string, Promise<void> | undefined>>({})

  const getDict = async (dictCode: string) => {
    // Return from cache if exists
    if (dictMap.value[dictCode]) {
      return dictMap.value[dictCode]
    }

    // Return existing promise if request is already pending to avoid duplicate requests
    if (pendingRequests.value[dictCode]) {
      await pendingRequests.value[dictCode]
      return dictMap.value[dictCode] || []
    }

    // Fetch from API
    const request = (async () => {
      try {
        const res = await getDictionaryItemListByCode(dictCode)
        dictMap.value[dictCode] = Array.isArray(res.data) ? res.data : []
      } catch (error) {
        console.error(`Failed to load dictionary: ${dictCode}`, error)
        delete dictMap.value[dictCode]
      } finally {
        delete pendingRequests.value[dictCode]
      }
    })()

    pendingRequests.value[dictCode] = request
    await request
    return dictMap.value[dictCode] || []
  }

  // Optional: clear cache or refresh specific dict
  const refreshDict = (dictCode: string) => {
    delete dictMap.value[dictCode]
    return getDict(dictCode)
  }

  return {
    dictMap,
    getDict,
    refreshDict,
  }
})
