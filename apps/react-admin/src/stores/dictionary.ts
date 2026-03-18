import { create } from 'zustand'
import { getDictionaryItemListByCode, type DictionaryItem } from '@/api/dictionary'

type DictionaryState = {
  dictMap: Record<string, DictionaryItem[]>
  pendingRequests: Record<string, Promise<DictionaryItem[]> | undefined>
  getDict: (dictCode: string) => Promise<DictionaryItem[]>
  refreshDict: (dictCode: string) => Promise<DictionaryItem[]>
}

export const useDictionaryStore = create<DictionaryState>()((set, get) => ({
  dictMap: {},
  pendingRequests: {},
  getDict: async (dictCode) => {
    const cached = get().dictMap[dictCode]
    if (cached) {
      return cached
    }

    const pending = get().pendingRequests[dictCode]
    if (pending) {
      return pending
    }

    const promise = getDictionaryItemListByCode(dictCode)
      .then((items) => {
        set((state) => ({
          dictMap: {
            ...state.dictMap,
            [dictCode]: Array.isArray(items) ? items : [],
          },
          pendingRequests: {
            ...state.pendingRequests,
            [dictCode]: undefined,
          },
        }))

        return items
      })
      .catch((error) => {
        set((state) => ({
          pendingRequests: {
            ...state.pendingRequests,
            [dictCode]: undefined,
          },
        }))
        throw error
      })

    set((state) => ({
      pendingRequests: {
        ...state.pendingRequests,
        [dictCode]: promise,
      },
    }))

    return promise
  },
  refreshDict: async (dictCode) => {
    set((state) => ({
      dictMap: {
        ...state.dictMap,
        [dictCode]: undefined as never,
      },
    }))
    const nextMap = { ...get().dictMap }
    delete nextMap[dictCode]
    set({ dictMap: nextMap })
    return get().getDict(dictCode)
  },
}))
