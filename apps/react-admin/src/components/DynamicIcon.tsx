import {
  Children,
  createElement,
  isValidElement,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type IconModule = Record<string, IconComponent>

const svgPropMap: Record<string, string> = {
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-width': 'strokeWidth',
}

function sanitizeSvgNode(node: ReactNode): ReactNode {
  if (!isValidElement(node)) {
    return node
  }

  const props = node.props as Record<string, unknown>
  const nextProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      continue
    }

    nextProps[svgPropMap[key] ?? key] = value
  }

  if (node.key != null) {
    nextProps.key = node.key
  }

  const children = props.children === undefined
    ? undefined
    : Children.toArray(props.children as ReactNode).map((child) => sanitizeSvgNode(child))

  return children
    ? createElement(node.type, nextProps, ...children)
    : createElement(node.type, nextProps)
}

function normalizeIconModule(module: object) {
  return module as unknown as IconModule
}

const iconLoaders: Record<string, () => Promise<IconModule>> = {
  antd: () => import('@ricons/antd').then(normalizeIconModule),
  ionicons5: () => import('@ricons/ionicons5').then(normalizeIconModule),
  material: () => import('@ricons/material').then(normalizeIconModule),
}

const iconModuleCache = new Map<string, IconModule>()
const iconPromiseCache = new Map<string, Promise<IconModule>>()

function loadIconModule(prefix: string) {
  const cachedModule = iconModuleCache.get(prefix)
  if (cachedModule) {
    return Promise.resolve(cachedModule)
  }

  const cachedPromise = iconPromiseCache.get(prefix)
  if (cachedPromise) {
    return cachedPromise
  }

  const loader = iconLoaders[prefix]
  if (!loader) {
    return Promise.resolve({} as IconModule)
  }

  const promise = loader().then((module) => {
    iconModuleCache.set(prefix, module)
    return module
  })

  iconPromiseCache.set(prefix, promise)
  return promise
}

export function DynamicIcon({
  icon,
  className,
}: {
  icon?: string | null
  className?: string
}) {
  const [IconComponent, setIconComponent] = useState<IconComponent | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!icon) {
      setIconComponent(null)
      return () => {
        cancelled = true
      }
    }

    const [prefix, name] = icon.split(':')
    if (!prefix || !name) {
      setIconComponent(null)
      return () => {
        cancelled = true
      }
    }

    void loadIconModule(prefix).then((module) => {
      if (cancelled) {
        return
      }

      setIconComponent(() => module[name] ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [icon])

  if (!icon) {
    return null
  }

  if (!IconComponent) {
    return null
  }

  const renderable = IconComponent as IconComponent & {
    render?: (props: SVGProps<SVGSVGElement>, ref: unknown) => ReactNode
  }

  if (typeof renderable.render === 'function') {
    return sanitizeSvgNode(renderable.render({ className: className ?? 'size-4' }, null))
  }

  return <IconComponent className={className ?? 'size-4'} />
}
