import { ref, computed, shallowRef } from 'vue'
import { PRIME_ICONS } from './generated-icons'

export interface IconItem {
  name: string
  displayName: string
  component?: unknown
}

export interface PrimeIconItem {
  name: string
  className: string
}

const PAGE_SIZE = 64

export function useIconLoader() {
  const primeIconsList = ref<PrimeIconItem[]>(PRIME_ICONS)
  const materialIconsList = shallowRef<IconItem[]>([])
  const loadingPrime = ref(false)
  const loadingMaterial = ref(false)

  const primeIconsPage = ref(1)
  const materialIconsPage = ref(1)

  // PrimeIcons 分页
  const paginatedPrimeIcons = computed(() => {
    const start = (primeIconsPage.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return primeIconsList.value.slice(start, end)
  })

  const primeIconsTotalPages = computed(() => {
    return Math.ceil(primeIconsList.value.length / PAGE_SIZE)
  })

  // Material Icons 分页
  const paginatedMaterialIcons = computed(() => {
    const start = (materialIconsPage.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return materialIconsList.value.slice(start, end)
  })

  const materialIconsTotalPages = computed(() => {
    return Math.ceil(materialIconsList.value.length / PAGE_SIZE)
  })

  const loadMaterialIcons = async () => {
    if (materialIconsList.value.length > 0) return

    loadingMaterial.value = true
    try {
      const MaterialIcons = await import('@vicons/material')
      const icons: IconItem[] = []

      for (const key in MaterialIcons) {
        const value = MaterialIcons[key as keyof typeof MaterialIcons]
        if (
          value &&
          typeof value === 'object' &&
          ('render' in value || 'setup' in value || '__asyncLoader' in value)
        ) {
          const displayName = key
            .replace(/^(Md|Filled|Outlined|Rounded|Sharp|TwoTone)/, '')
            .replace(/([A-Z])/g, ' $1')
            .trim()
          icons.push({
            name: key,
            displayName: displayName || key,
            component: value,
          })
        }
      }

      icons.sort((a, b) => a.name.localeCompare(b.name))
      materialIconsList.value = icons
    } catch (error) {
      console.error('Failed to load material icons:', error)
    } finally {
      loadingMaterial.value = false
    }
  }

  return {
    // State
    primeIconsList,
    materialIconsList,
    loadingPrime,
    loadingMaterial,
    primeIconsPage,
    materialIconsPage,
    paginatedPrimeIcons,
    paginatedMaterialIcons,
    primeIconsTotalPages,
    materialIconsTotalPages,
    PAGE_SIZE,
    loadMaterialIcons,
  }
}
