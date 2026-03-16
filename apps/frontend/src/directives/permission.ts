import type { App, DirectiveBinding } from 'vue'
import type { Pinia } from 'pinia'
import { useRouteStore } from '@/stores/route'

type PermissionBindingValue =
  | string
  | string[]
  | {
      code: string | string[]
      mode?: 'any' | 'all'
    }

const evaluatePermission = (value: PermissionBindingValue, hasPermission: (code: string) => boolean) => {
  if (typeof value === 'string') {
    return hasPermission(value)
  }

  if (Array.isArray(value)) {
    return value.some((code) => hasPermission(code))
  }

  const codes = Array.isArray(value.code) ? value.code : [value.code]
  const mode = value.mode || 'any'

  if (!codes.length) return true
  if (mode === 'all') {
    return codes.every((code) => hasPermission(code))
  }
  return codes.some((code) => hasPermission(code))
}

const updateElementVisibility = (
  el: HTMLElement,
  binding: DirectiveBinding<PermissionBindingValue>,
  pinia: Pinia,
) => {
  const routeStore = useRouteStore(pinia)
  const hasPermission = (code: string) => routeStore.hasPermission(code)
  const value = binding.value

  if (!value) {
    el.style.display = ''
    return
  }

  const allowed = evaluatePermission(value, hasPermission)
  el.style.display = allowed ? '' : 'none'
}

export const registerPermissionDirective = (app: App, pinia: Pinia) => {
  app.directive('permission', {
    mounted(el, binding) {
      updateElementVisibility(el as HTMLElement, binding, pinia)
    },
    updated(el, binding) {
      updateElementVisibility(el as HTMLElement, binding, pinia)
    },
  })
}
