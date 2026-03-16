# Casbin Admin Backend

基于 NestJS 的后台服务，集成 JWT 鉴权、CASL 权限控制、Prisma ORM、Redis 缓存与操作日志能力，适用于管理系统后端场景。

## 项目结构

```text
.
├── src/
│   ├── app/
│   │   ├── system/        # 业务模块：auth/user/role/permission/dept/post/file/timer...
│   │   └── library/       # 基础能力：casl/prisma/redis/logger/data-scope
│   ├── common/            # 通用拦截器、过滤器、DTO、装饰器、工具
│   └── config/            # 配置加载与 schema 校验
├── prisma/                # Prisma schema、迁移、seed
├── test/                  # e2e 测试
├── config/                # default/development/production.yaml
├── scripts/               # 数据库维护与性能测试脚本
└── uploads/               # 上传文件目录
```

## 本地开发

1. 安装依赖：`pnpm install`
2. 配置环境变量（至少 `DATABASE_URL`）：`.env`
3. 执行迁移：`npx prisma migrate deploy`
4. 启动开发环境：`pnpm dev`

默认端口 `8080`，接口前缀 `/api`。文档地址：
- Swagger: `http://localhost:8080/api-docs`
- Scalar: `http://localhost:8080/reference`

## 常用命令

- `pnpm dev`：开发模式（watch）
- `pnpm build`：编译到 `dist/`
- `pnpm start:prod`：生产模式运行
- `pnpm lint`：执行 `oxlint + eslint` 自动修复
- `pnpm format` / `pnpm format:check`：代码格式化/检查（oxfmt）
- `pnpm test`：单元测试
- `pnpm test:e2e`：端到端测试
- `pnpm test:cov`：覆盖率报告
- `pnpm test:performance`：数据库性能测试

## 编码与命名规范

- 语言：TypeScript（NestJS 模块化结构）。
- 缩进：2 空格；提交前运行 `pnpm format && pnpm lint`。
- 命名建议：
  - 文件：`kebab-case`（如 `user.service.ts`）
  - 类/DTO/Entity：`PascalCase`
  - 变量/方法：`camelCase`

## 测试规范

- 单测文件：`*.spec.ts`（位于 `src/` 下）。
- e2e 文件：`test/*.e2e-spec.ts`。
- 新增模块时至少补充 service/controller 关键路径测试；涉及权限、鉴权、数据范围逻辑时优先补 e2e。

## 提交与 PR 规范

当前历史中已使用 `type: subject`（例如：`init: first commit`），建议统一为 Conventional Commits：

- `feat(auth): add refresh token interceptor`
- `fix(user): handle duplicated username`
- `chore(prisma): update migration`

PR 建议包含：
- 变更目的与影响范围
- 数据库变更说明（是否需要执行 migration）
- 测试结果（`pnpm test`/`pnpm test:e2e`）
- 接口变更时附示例请求或文档截图

## 配置与安全

- 配置来源：`config/*.yaml` + `.env`。
- 请勿提交真实数据库账号、JWT 密钥、Redis 密码。
- 生产环境务必替换 `config/*.yaml` 中默认 `jwt.secret`，并限制日志级别与慢查询配置。
