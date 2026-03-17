# @casbin-admin/icons

`@casbin-admin/icons` 是 monorepo 内部的图标基础包，负责统一接入 `unplugin-icons`，并提供：

- 包内自定义 SVG collection
- 应用侧自定义 SVG 目录接入
- `IconsResolver` 与 Vite 插件工厂

## 默认约定

- 包内 collection：`casbin`
- 应用侧 collection：`app`
- 自动注册组件前缀：`Icon`

因此默认可以这样使用：

- `~icons/casbin/shield-key`
- `~icons/app/logo-mark`
- `<IconCasbinShieldKey />`
- `<IconAppLogoMark />`

## Vite 接入

```ts
import Components from 'unplugin-vue-components/vite'
import { createIconsPlugin, createIconsResolver, resolveAppIconDir } from '@casbin-admin/icons'

Components({
  resolvers: [
    createIconsResolver({
      appIconDir: resolveAppIconDir(process.cwd()),
    }),
  ],
})

createIconsPlugin({
  appIconDir: resolveAppIconDir(process.cwd()),
})
```

## 包内图标

- `casbin:shield-key`
- `casbin:orbit-panel`

## 应用侧自定义图标

frontend 默认目录建议放在：

`src/assets/icons`

例如：

`src/assets/icons/logo-mark.svg`

就可以直接写成：

- `~icons/app/logo-mark`
- `<IconAppLogoMark />`
