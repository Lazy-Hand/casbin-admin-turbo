import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConfigByKey, getConfigsByKeys, getAllConfigs, type Config } from '@/api/config'

export const useConfigStore = defineStore('config', () => {
  const configMap = ref<Record<string, string>>({})
  const pendingRequests = ref<Record<string, Promise<void> | undefined>>({})

  // 获取单个配置值 (带内存缓存)
  const getConfig = async (key: string): Promise<string> => {
    // 内存缓存命中
    if (configMap.value[key] !== undefined) {
      return configMap.value[key]
    }

    // 防止重复请求
    if (pendingRequests.value[key]) {
      await pendingRequests.value[key]
      return configMap.value[key] ?? ''
    }

    // 发起请求
    const request = (async () => {
      try {
        const res = await getConfigByKey(key)
        configMap.value[key] = res.data ?? ''
      } catch (error) {
        console.error(`Failed to load config: ${key}`, error)
        configMap.value[key] = ''
      } finally {
        delete pendingRequests.value[key]
      }
    })()

    pendingRequests.value[key] = request
    await request
    return configMap.value[key] ?? ''
  }

  // 批量获取配置值
  const getConfigs = async (keys: string[]): Promise<Record<string, string>> => {
    // 过滤出未缓存的 keys
    const uncachedKeys = keys.filter((k) => configMap.value[k] === undefined)

    // 获取已缓存的值
    const result: Record<string, string> = {}
    keys.forEach((key) => {
      if (configMap.value[key] !== undefined) {
        result[key] = configMap.value[key]
      }
    })

    // 批量获取未缓存的配置
    if (uncachedKeys.length > 0) {
      try {
        const res = await getConfigsByKeys(uncachedKeys)
        // 更新缓存和结果
        Object.entries(res.data).forEach(([key, value]) => {
          configMap.value[key] = value
          result[key] = value
        })
        // 对于未返回的 key，设置为空字符串
        uncachedKeys.forEach((key) => {
          if (result[key] === undefined) {
            configMap.value[key] = ''
            result[key] = ''
          }
        })
      } catch (error) {
        console.error('Failed to load configs:', error)
        uncachedKeys.forEach((key) => {
          configMap.value[key] = ''
          result[key] = ''
        })
      }
    }

    return result
  }

  // 加载所有配置 (应用初始化时使用)
  const loadAllConfigs = async (): Promise<Config[]> => {
    try {
      const res = await getAllConfigs()
      // 更新内存缓存
      res.data.forEach((config) => {
        configMap.value[config.configKey] = config.configValue
      })
      return res.data
    } catch (error) {
      console.error('Failed to load all configs:', error)
      return []
    }
  }

  // 刷新指定配置
  const refreshConfig = (key: string) => {
    delete configMap.value[key]
    return getConfig(key)
  }

  // 清空缓存
  const clearCache = () => {
    configMap.value = {}
    pendingRequests.value = {}
  }

  return {
    configMap,
    getConfig,
    getConfigs,
    loadAllConfigs,
    refreshConfig,
    clearCache,
  }
})
