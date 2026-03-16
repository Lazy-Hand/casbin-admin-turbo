# @casbin-admin/frontend

`apps/frontend` 是本仓库中的管理端前端应用，基于 Vue 3 + Vite + TypeScript。

如果你是从仓库根目录进入，建议先看根 [README.md](../../README.md)；这里主要补充 frontend 自身的说明。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Naive UI / Pro Naive UI
- Tailwind CSS 4

## 目录结构

```text
src/
  api/            # 按业务拆分的接口层
  router/         # 静态路由、动态路由加载、路由守卫
  stores/         # Pinia 状态
  views/          # 页面
  components/     # 业务组件与通用 UI 组件
  layouts/        # 主框架布局
  styles/         # 全局样式
plugins/
  auto-proxy.ts   # 从环境变量注入 Vite proxy
scripts/
  generate-icon-lists.ts
```

## 开发命令

推荐从仓库根目录执行：

```bash
pnpm --filter @casbin-admin/frontend dev
pnpm --filter @casbin-admin/frontend type-check
pnpm --filter @casbin-admin/frontend lint
pnpm --filter @casbin-admin/frontend build
pnpm --filter @casbin-admin/frontend preview
```

如果当前目录就在 `apps/frontend`，也可以直接执行：

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
```

## 环境变量

开发环境主要使用 `.env.development`：

```env
VITE_PROXY=[['/api','http://localhost:8080']]
```

`plugins/auto-proxy.ts` 会读取这个配置并注入 Vite 代理。

## 约定

- 组件使用 `PascalCase.vue`
- 组合式函数使用 `useXxx.ts`
- API 模块按业务拆分
- 当前格式风格为：单引号、无分号

## 质量门禁

提交前建议至少通过：

```bash
pnpm --filter @casbin-admin/frontend type-check
pnpm --filter @casbin-admin/frontend lint
pnpm --filter @casbin-admin/frontend build
```
