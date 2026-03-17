import { computed, ref, shallowRef } from 'vue'

export interface IconItem {
  name: string
  displayName: string
  component?: unknown
}

const PAGE_SIZE = 64

function isIconComponent(value: unknown) {
  return (
    !!value &&
    typeof value === 'object' &&
    ('render' in value || 'setup' in value || '__asyncLoader' in value)
  )
}

function formatDisplayName(key: string, prefixes: RegExp[] = []) {
  const normalized = prefixes.reduce((name, pattern) => name.replace(pattern, ''), key)

  return (
    normalized
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim() || key
  )
}

async function loadIconLibrary(
  loader: () => Promise<Record<string, unknown>>,
  displayNamePrefixes: RegExp[] = [],
) {
  const iconsModule = await loader()
  const icons: IconItem[] = []

  for (const key in iconsModule) {
    const value = iconsModule[key]
    if (!isIconComponent(value)) continue

    icons.push({
      name: key,
      displayName: formatDisplayName(key, displayNamePrefixes),
      component: value,
    })
  }

  icons.sort((a, b) => a.name.localeCompare(b.name))
  return icons
}

export function useIconLoader() {
  const materialIconsList = shallowRef<IconItem[]>([])
  const antdIconsList = shallowRef<IconItem[]>([])
  const ioniconsIconsList = shallowRef<IconItem[]>([])
  const loadingMaterial = ref(false)
  const loadingAntd = ref(false)
  const loadingIonicons = ref(false)

  const materialIconsPage = ref(1)
  const antdIconsPage = ref(1)
  const ioniconsIconsPage = ref(1)

  const paginatedMaterialIcons = computed(() => {
    const start = (materialIconsPage.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return materialIconsList.value.slice(start, end)
  })

  const materialIconsTotalPages = computed(() => {
    return Math.ceil(materialIconsList.value.length / PAGE_SIZE)
  })

  const paginatedAntdIcons = computed(() => {
    const start = (antdIconsPage.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return antdIconsList.value.slice(start, end)
  })

  const antdIconsTotalPages = computed(() => {
    return Math.ceil(antdIconsList.value.length / PAGE_SIZE)
  })

  const paginatedIoniconsIcons = computed(() => {
    const start = (ioniconsIconsPage.value - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return ioniconsIconsList.value.slice(start, end)
  })

  const ioniconsIconsTotalPages = computed(() => {
    return Math.ceil(ioniconsIconsList.value.length / PAGE_SIZE)
  })

  const loadMaterialIcons = async () => {
    if (materialIconsList.value.length > 0) return

    loadingMaterial.value = true
    try {
      materialIconsList.value = await loadIconLibrary(
        () => import('@vicons/material') as Promise<Record<string, unknown>>,
        [/^(Md|Filled|Outlined|Rounded|Sharp|TwoTone)/],
      )
    } catch (error) {
      console.error('Failed to load material icons:', error)
    } finally {
      loadingMaterial.value = false
    }
  }

  const loadAntdIcons = async () => {
    if (antdIconsList.value.length > 0) return

    loadingAntd.value = true
    try {
      antdIconsList.value = await loadIconLibrary(
        () => import('@vicons/antd') as Promise<Record<string, unknown>>,
        [/^(Ai|Outlined|Filled|Twotone)/],
      )
    } catch (error) {
      console.error('Failed to load antd icons:', error)
    } finally {
      loadingAntd.value = false
    }
  }

  const loadIoniconsIcons = async () => {
    if (ioniconsIconsList.value.length > 0) return

    loadingIonicons.value = true
    try {
      ioniconsIconsList.value = await loadIconLibrary(
        () => import('@vicons/ionicons5') as Promise<Record<string, unknown>>,
        [/^(Io|Ios|Logo|Md)/],
      )
    } catch (error) {
      console.error('Failed to load ionicons icons:', error)
    } finally {
      loadingIonicons.value = false
    }
  }

  return {
    materialIconsList,
    antdIconsList,
    ioniconsIconsList,
    loadingMaterial,
    loadingAntd,
    loadingIonicons,
    materialIconsPage,
    antdIconsPage,
    ioniconsIconsPage,
    paginatedMaterialIcons,
    paginatedAntdIcons,
    paginatedIoniconsIcons,
    materialIconsTotalPages,
    antdIconsTotalPages,
    ioniconsIconsTotalPages,
    PAGE_SIZE,
    loadMaterialIcons,
    loadAntdIcons,
    loadIoniconsIcons,
  }
}
