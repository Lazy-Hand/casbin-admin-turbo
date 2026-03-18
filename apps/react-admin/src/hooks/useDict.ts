import { useEffect, useMemo, useState } from 'react'
import { useDictionaryStore } from '@/stores/dictionary'

const EMPTY_ITEMS: never[] = []

export function useDict(dictCode: string) {
  const dictMap = useDictionaryStore((state) => state.dictMap)
  const getDict = useDictionaryStore((state) => state.getDict)
  const [loading, setLoading] = useState(false)

  const items = useMemo(() => dictMap[dictCode] ?? EMPTY_ITEMS, [dictCode, dictMap])

  useEffect(() => {
    let cancelled = false

    if (dictMap[dictCode]) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)
    void getDict(dictCode).finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [dictCode, dictMap, getDict])

  const getLabel = useMemo(
    () => (value: string | number) => {
      const matched = items.find((item) => item.value == String(value))
      return matched ? matched.label : value
    },
    [items],
  )

  return {
    items,
    loading,
    getLabel,
  }
}
