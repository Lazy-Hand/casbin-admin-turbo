import { useCallback, useMemo, useState } from 'react'

export type IconLibraryKey = 'antd' | 'material' | 'ionicons5'

export type IconItem = {
  name: string
  displayName: string
  icon: string
}

const PAGE_SIZE = 64

const iconLoaders: Record<IconLibraryKey, () => Promise<Record<string, unknown>>> = {
  antd: () => import('@ricons/antd') as Promise<Record<string, unknown>>,
  material: () => import('@ricons/material') as Promise<Record<string, unknown>>,
  ionicons5: () => import('@ricons/ionicons5') as Promise<Record<string, unknown>>,
}

const iconCache = new Map<IconLibraryKey, IconItem[]>()

function isIconComponent(value: unknown) {
  return (
    !!value &&
    typeof value === 'object' &&
    ('render' in value || 'setup' in value || '$$typeof' in value)
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

function getDisplayNamePrefixes(library: IconLibraryKey) {
  if (library === 'antd') {
    return [/^(Ai|Outlined|Filled|Twotone)/]
  }

  if (library === 'material') {
    return [/^(Md|Filled|Outlined|Rounded|Sharp|TwoTone)/]
  }

  return [/^(Io|Ios|Logo|Md)/]
}

async function loadIconLibrary(library: IconLibraryKey) {
  const cached = iconCache.get(library)
  if (cached) {
    return cached
  }

  const module = await iconLoaders[library]()
  const prefixes = getDisplayNamePrefixes(library)
  const icons: IconItem[] = []

  for (const key in module) {
    const value = module[key]
    if (!isIconComponent(value)) {
      continue
    }

    icons.push({
      name: key,
      displayName: formatDisplayName(key, prefixes),
      icon: `${library}:${key}`,
    })
  }

  icons.sort((a, b) => a.name.localeCompare(b.name))
  iconCache.set(library, icons)
  return icons
}

export function useIconLoader() {
  const [iconsMap, setIconsMap] = useState<Partial<Record<IconLibraryKey, IconItem[]>>>({})
  const [loadingMap, setLoadingMap] = useState<Partial<Record<IconLibraryKey, boolean>>>({})

  const loadIcons = useCallback(
    async (library: IconLibraryKey) => {
      if (iconsMap[library]?.length) {
        return iconsMap[library]!
      }

      setLoadingMap((current) => ({
        ...current,
        [library]: true,
      }))

      try {
        const icons = await loadIconLibrary(library)
        setIconsMap((current) => ({
          ...current,
          [library]: icons,
        }))
        return icons
      } finally {
        setLoadingMap((current) => ({
          ...current,
          [library]: false,
        }))
      }
    },
    [iconsMap],
  )

  const getIcons = useCallback(
    (library: IconLibraryKey, keyword: string, page: number) => {
      const source = iconsMap[library] || []
      const filtered = keyword
        ? source.filter((item) => {
            const needle = keyword.toLowerCase()
            return (
              item.name.toLowerCase().includes(needle) ||
              item.displayName.toLowerCase().includes(needle)
            )
          })
        : source

      const total = filtered.length
      const start = (page - 1) * PAGE_SIZE

      return {
        items: filtered.slice(start, start + PAGE_SIZE),
        total,
        pageSize: PAGE_SIZE,
      }
    },
    [iconsMap],
  )

  return useMemo(
    () => ({
      loadingMap,
      loadIcons,
      getIcons,
      pageSize: PAGE_SIZE,
    }),
    [getIcons, loadIcons, loadingMap],
  )
}
