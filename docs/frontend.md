# 前端说明

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
apps/frontend/src/
  api/
  router/
  stores/
  views/
  components/
  layouts/
  styles/
```

## 环境变量

- 开发环境主要使用 `apps/frontend/.env.development`
- `VITE_PROXY` 控制本地 API 代理

## 开发与构建

```bash
pnpm --filter @casbin-admin/frontend dev
pnpm --filter @casbin-admin/frontend type-check
pnpm --filter @casbin-admin/frontend lint
pnpm --filter @casbin-admin/frontend build
```

## 约定

- 组件使用 `PascalCase`
- 组合式函数使用 `useXxx.ts`
- API 模块按业务拆分
- 保持现有无分号格式风格
