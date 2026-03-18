import { create } from 'zustand'

type AppState = {
  appName: string
  buildLabel: string
  setAppName: (name: string) => void
  reset: () => void
}

const initialState = {
  appName: 'Casbin React Admin',
  buildLabel: 'Starter Kit',
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setAppName: (name) => set({ appName: name }),
  reset: () => set(initialState),
}))
