import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppTab = {
  key: string
  title: string
  fullPath: string
  affix?: boolean
}

const homeTab: AppTab = {
  key: '/',
  title: '首页',
  fullPath: '/',
  affix: true,
}

type TabsState = {
  tabs: AppTab[]
  ensureTab: (tab: AppTab) => void
  removeTab: (fullPath: string) => void
  closeLeftTabs: (fullPath: string) => void
  closeRightTabs: (fullPath: string) => void
  closeOtherTabs: (fullPath: string) => void
  closeAllTabs: () => void
  reorderTabs: (activePath: string, overPath: string) => void
  resetTabs: () => void
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [homeTab],
      ensureTab: (tab) =>
        set((state) => {
          const matchedIndex = state.tabs.findIndex((item) => item.fullPath === tab.fullPath)
          if (matchedIndex === -1) {
            return {
              tabs: [...state.tabs, tab],
            }
          }

          const nextTabs = [...state.tabs]
          const matchedTab = nextTabs[matchedIndex]
          if (!matchedTab) {
            return state
          }

          nextTabs[matchedIndex] = {
            ...matchedTab,
            title: tab.title,
          }

          return {
            tabs: nextTabs,
          }
        }),
      removeTab: (fullPath) =>
        set((state) => ({
          tabs: state.tabs.filter((item) => item.affix || item.fullPath !== fullPath),
        })),
      closeLeftTabs: (fullPath) =>
        set((state) => {
          const currentIndex = state.tabs.findIndex((item) => item.fullPath === fullPath)
          if (currentIndex === -1) {
            return state
          }

          return {
            tabs: state.tabs.filter((item, index) => item.affix || index >= currentIndex),
          }
        }),
      closeRightTabs: (fullPath) =>
        set((state) => {
          const currentIndex = state.tabs.findIndex((item) => item.fullPath === fullPath)
          if (currentIndex === -1) {
            return state
          }

          return {
            tabs: state.tabs.filter((item, index) => item.affix || index <= currentIndex),
          }
        }),
      closeOtherTabs: (fullPath) =>
        set((state) => ({
          tabs: state.tabs.filter((item) => item.affix || item.fullPath === fullPath),
        })),
      closeAllTabs: () =>
        set((state) => ({
          tabs: state.tabs.filter((item) => item.affix),
        })),
      reorderTabs: (activePath, overPath) =>
        set((state) => {
          if (activePath === overPath) {
            return state
          }

          const activeIndex = state.tabs.findIndex((item) => item.fullPath === activePath)
          const overIndex = state.tabs.findIndex((item) => item.fullPath === overPath)

          if (activeIndex === -1 || overIndex === -1) {
            return state
          }

          const activeTab = state.tabs[activeIndex]
          const overTab = state.tabs[overIndex]

          if (!activeTab || !overTab || activeTab.affix || overTab.affix) {
            return state
          }

          const nextTabs = [...state.tabs]
          nextTabs.splice(activeIndex, 1)
          nextTabs.splice(overIndex, 0, activeTab)

          return {
            tabs: nextTabs,
          }
        }),
      resetTabs: () =>
        set({
          tabs: [homeTab],
        }),
    }),
    {
      name: 'react-admin-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
      }),
    },
  ),
)
