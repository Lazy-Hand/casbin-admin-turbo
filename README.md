# casbin-admin-turbo

基于 `pnpm workspace + turbo` 的 Casbin Admin Monorepo，包含管理端前端与 NestJS 服务端，并统一了依赖管理、Lint 配置和根命令入口。

## 文档入口

- 项目入口文档：当前 `README.md`
- 项目 Wiki：[`docs/README.md`](./docs/README.md)

## Workspace Index

- Frontend App: [`apps/frontend/README.md`](./apps/frontend/README.md)
- Backend Service: [`services/backend/README.md`](./services/backend/README.md)
- Shared ESLint Config: [`packages/eslint-config/README.md`](./packages/eslint-config/README.md)

## 项目结构

```text
.
├── apps/
│   └── frontend/          # Vue 3 + Vite + TypeScript 管理端
├── services/
│   └── backend/           # NestJS + Drizzle + PostgreSQL 服务端
├── packages/
│   └── eslint-config/     # 共享 ESLint 配置
├── AGENTS.md              # Monorepo 统一协作规范
├── package.json           # 根命令入口
├── pnpm-workspace.yaml    # Workspace + catalog 配置
└── turbo.json             # Turbo 任务编排
```

## 技术栈

- Monorepo: `pnpm workspace`, `turbo`
- Frontend: Vue 3, Vite, TypeScript, Pinia, Vue Router, Naive UI, Tailwind CSS 4
- Backend: NestJS, Drizzle ORM, PostgreSQL, Redis, CASL, Swagger
- Quality: ESLint, oxlint, oxfmt, TypeScript

## 环境要求

- Node.js: `^20.19.0 || >=22.12.0`
- pnpm: `10.x`

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

前端开发代理配置位于：

```env
# apps/frontend/.env.development
VITE_PROXY=[['/api','http://localhost:8080']]
```

后端本地数据库配置位于：

```env
# services/backend/.env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/casbin-admin?schema=public&connection_limit=10&pool_timeout=10"
```

### 3. 初始化数据库

在 backend 工作区执行数据库迁移：

```bash
pnpm --filter @casbin-admin/backend db:migrate
```

### 4. 启动开发环境

同时启动前后端：

```bash
pnpm dev
```

分别启动：

```bash
pnpm dev:frontend
pnpm dev:backend
```

默认地址：

- Frontend: `http://localhost:7777`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/api-docs`
- Scalar: `http://localhost:8080/reference`

## 常用命令

### 根目录命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm type-check
pnpm format
pnpm format:check
```

### 按工作区执行

```bash
pnpm --filter @casbin-admin/frontend dev
pnpm --filter @casbin-admin/frontend build
pnpm --filter @casbin-admin/frontend type-check

pnpm --filter @casbin-admin/backend dev
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
pnpm --filter @casbin-admin/backend test:e2e
pnpm --filter @casbin-admin/backend db:generate
pnpm --filter @casbin-admin/backend db:migrate
```

## 依赖与规范

- 根仓库使用单一 `pnpm-lock.yaml`，不要在子项目保留独立锁文件。
- 工具链和跨包基础依赖统一收敛到 `pnpm-workspace.yaml` 的 `catalog`。
- 共享 ESLint 配置位于 `packages/eslint-config`，前后端仅保留薄的本地 `eslint.config.*`。
- 前端与后端暂时保留各自格式化风格：
  - frontend: 单引号、无分号
  - backend: 单引号、有分号

## 前端说明

`apps/frontend` 是基于 Vue 3 的后台管理端，主要目录包括：

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
```

前端最低质量门禁建议：

```bash
pnpm --filter @casbin-admin/frontend type-check
pnpm --filter @casbin-admin/frontend lint
pnpm --filter @casbin-admin/frontend build
```

## 后端说明

`services/backend` 是基于 NestJS 的后台服务，主要目录包括：

```text
src/
  app/
    system/       # 业务模块
    library/      # 基础能力
  common/         # 通用拦截器、过滤器、DTO、装饰器、工具
db/               # SQL migrations、seed
config/           # default/development/production.yaml
test/             # e2e 测试
scripts/          # 数据库维护与性能脚本
```

后端最低质量门禁建议：

```bash
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
```

## 提交建议

推荐使用 Conventional Commits，例如：

- `feat: add role filter`
- `chore: remove prisma cli`
- `chore: align workspace catalog`

## 安全说明

- 不要提交真实数据库账号、JWT 密钥、Redis 密码等敏感信息。
- 后端数据库结构变更应通过 schema / migration 流程管理，不要直接在生产环境手工修改。
- 修改 `packages/*` 或根工具链配置前，注意它会影响整个 monorepo。
