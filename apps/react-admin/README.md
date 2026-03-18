# React Admin

`apps/react-admin` 是本仓库中的 React 管理端应用，基于 React + Vite + TypeScript。

如果你是从仓库根目录进入，建议先看根 [README.md](../../README.md)；这里主要补充 `react-admin` 自身的说明。

## 技术栈

- React
- Vite
- TypeScript
- Ant Design
- TanStack Router
- Zustand
- Tailwind CSS 4
- shadcn/ui 基础设施
- TanStack Query

## 目录结构

```text
src/
  api/            # 接口层
  components/     # 布局、权限组件、UI 组件
  config/         # 本地路由与菜单配置
  hooks/          # 业务 hooks
  lib/            # request、query-client、utils
  pages/          # 页面
  stores/         # Zustand 状态
  types/          # 类型定义
```

## 开发命令

推荐从仓库根目录执行：

```bash
pnpm --filter @casbin-admin/react-admin dev
pnpm --filter @casbin-admin/react-admin type-check
pnpm --filter @casbin-admin/react-admin lint
pnpm --filter @casbin-admin/react-admin build
```

如果当前目录就在 `apps/react-admin`，也可以直接执行：

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
```

## 环境变量

开发环境主要使用 `.env.development`：

```env
VITE_API_BASE_URL=/api
VITE_PROXY=[['/api','http://localhost:8080']]
```

`@casbin-admin/vite-auto-proxy` 会读取 `VITE_PROXY` 并自动注入 Vite 代理。

## 约定

- 页面路由使用 TanStack Router 管理
- 登录、用户信息、路由权限与 Vue 项目共用同一套后端接口
- 当前格式风格为：单引号、无分号

## 质量门禁

提交前建议至少通过：

```bash
pnpm --filter @casbin-admin/react-admin type-check
pnpm --filter @casbin-admin/react-admin lint
pnpm --filter @casbin-admin/react-admin build
```
