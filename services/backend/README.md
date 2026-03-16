# @casbin-admin/backend

`services/backend` 是本仓库中的服务端应用，基于 NestJS + Prisma + PostgreSQL。

如果你是从仓库根目录进入，建议先看根 [README.md](../../README.md)；这里主要补充 backend 自身的说明。

## 技术栈

- NestJS
- Prisma
- PostgreSQL
- Redis
- CASL
- Swagger / Scalar

## 目录结构

```text
src/
  app/
    system/       # 业务模块
    library/      # 基础能力
  common/         # 通用拦截器、过滤器、DTO、装饰器、工具
prisma/           # schema、迁移、seed
config/           # default/development/production.yaml
test/             # e2e 测试
scripts/          # 数据库维护与性能脚本
```

## 开发命令

推荐从仓库根目录执行：

```bash
pnpm --filter @casbin-admin/backend dev
pnpm --filter @casbin-admin/backend prisma:generate
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
pnpm --filter @casbin-admin/backend test:e2e
```

如果当前目录就在 `services/backend`，也可以直接执行：

```bash
pnpm dev
pnpm prisma:generate
pnpm type-check
pnpm lint
pnpm build
pnpm test
```

## Prisma

- Prisma schema 位于 `prisma/schema.prisma`
- `pnpm install`、`pnpm build`、`pnpm type-check` 前会自动执行 `prisma generate`
- 本地数据库连接通过 `.env` 中的 `DATABASE_URL` 提供

初始化迁移示例：

```bash
pnpm --filter @casbin-admin/backend exec prisma migrate deploy
```

## 接口文档

- API 前缀：`/api`
- Swagger：`http://localhost:8080/api-docs`
- Scalar：`http://localhost:8080/reference`

## 约定

- 文件名使用 `kebab-case`
- 类、DTO、Entity 使用 `PascalCase`
- 当前格式风格为：单引号、有分号

## 质量门禁

提交前建议至少通过：

```bash
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
```
