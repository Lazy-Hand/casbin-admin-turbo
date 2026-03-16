# 后端说明

## 技术栈

- NestJS
- Drizzle Kit
- PostgreSQL
- Redis
- CASL
- Swagger

## 目录结构

```text
services/backend/src/
  app/system/
  app/library/
  common/

services/backend/db/
services/backend/config/
services/backend/test/
services/backend/scripts/
```

## 启动与构建

```bash
pnpm --filter @casbin-admin/backend dev
pnpm --filter @casbin-admin/backend type-check
pnpm --filter @casbin-admin/backend lint
pnpm --filter @casbin-admin/backend build
pnpm --filter @casbin-admin/backend test
pnpm --filter @casbin-admin/backend test:e2e
```

## 接口与文档

- API 默认前缀：`/api`
- Swagger：`http://localhost:8080/api-docs`
- Scalar：`http://localhost:8080/reference`

## 约定

- 文件名使用 `kebab-case`
- DTO、Entity、类名使用 `PascalCase`
- 保持现有有分号格式风格
- 数据库 schema、SQL 迁移与 seed 暂时保留在 backend 内，不单独抽包
