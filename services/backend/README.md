# @casbin-admin/backend

`services/backend` 是本仓库中的服务端应用，基于 NestJS + PostgreSQL，运行时数据库访问统一使用 Drizzle ORM。

如果你是从仓库根目录进入，建议先看根 [README.md](../../README.md)；这里主要补充 backend 自身的说明。

## 技术栈

- NestJS
- Drizzle ORM
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
db/               # SQL migrations、seed
config/           # default/development/production.yaml
test/             # e2e 测试
scripts/          # 数据库维护与性能脚本
```

## 开发命令

推荐从仓库根目录执行：

```bash
pnpm --filter @casbin-admin/backend dev
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
pnpm --filter @casbin-admin/backend test:e2e
pnpm --filter @casbin-admin/backend db:generate
pnpm --filter @casbin-admin/backend db:migrate
```

如果当前目录就在 `services/backend`，也可以直接执行：

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
pnpm test
pnpm db:generate
pnpm db:migrate
```

## Database Tooling

- 数据库 schema 位于 `src/app/library/drizzle/schema.ts`
- SQL 迁移位于 `db/migrations`
- 本地数据库连接通过 `.env` 中的 `DATABASE_URL` 提供

Drizzle 相关命令：

```bash
pnpm --filter @casbin-admin/backend db:generate
pnpm --filter @casbin-admin/backend db:migrate
pnpm --filter @casbin-admin/backend drizzle:studio
pnpm --filter @casbin-admin/backend db:seed
```

## 接口文档

- API 前缀：`/api`
- Swagger：`http://localhost:8080/api-docs`
- Scalar：`http://localhost:8080/reference`

## 约定

- 文件名使用 `kebab-case`
- 类、DTO、Entity 使用 `PascalCase`
- 当前格式风格为：单引号、有分号
- 主表软删除过滤统一使用 `withSoftDelete(Table, ...)`
- 关联表软删除过滤统一使用 `joinOnWithSoftDelete(Table, eq(...))`
- Drizzle 时间字段统一使用 `mode: 'string'`
- `updatedAt` / `deletedAt` 由 `updateWithAudit` / `softDeleteWhere` 自动维护

示例：

```ts
.from(User)
.leftJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(User.id, UserRole.userId)))
.leftJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
.where(withSoftDelete(User, eq(User.id, userId)))
```

时间字段示例：

```ts
createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).notNull().defaultNow()
updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull()
deletedAt: timestamp('deletedAt', { precision: 3, mode: 'string' })
```

## 质量门禁

提交前建议至少通过：

```bash
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
```
