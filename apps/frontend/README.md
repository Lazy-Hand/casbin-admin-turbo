# casbin-admin-frontend

基于 **Vue 3 + Vite + TypeScript** 的后台管理前端，内置登录鉴权、动态路由、系统管理模块（用户/角色/菜单/部门/字典/定时任务/日志等）。

## 技术栈

- Vue 3、Vue Router 4、Pinia
- Vite（含自动代理插件）
- Naive UI + Pro Naive UI + Tailwind CSS 4
- Axios（二次封装在 `src/utils/request`）
- i18n（`src/locales`）

## 项目结构

```text
src/
  api/            # 按业务拆分的接口层
  router/         # 静态路由、动态路由加载、路由守卫
  stores/         # Pinia 状态（用户、路由、字典等）
  views/          # 页面（dashboard/system/login/result...）
  components/     # 业务组件与通用 UI 组件
  layouts/        # 主框架布局（菜单、页签、页头）
  utils/request/  # Axios 实例、拦截器、错误处理
  styles/         # 全局样式与主题变量
plugins/
  auto-proxy.ts   # 从环境变量注入 Vite proxy
scripts/
  generate-icon-lists.ts # 生成 PrimeIcons 列表
```

## 本地开发

### 环境要求

- Node.js: `^20.19.0 || >=22.12.0`
- 包管理器: `pnpm`

### 常用命令

```bash
pnpm install             # 安装依赖
pnpm dev                 # 本地开发（默认端口 7777）
pnpm build               # 类型检查 + 构建
pnpm preview             # 预览构建产物
pnpm type-check          # 仅运行 vue-tsc
pnpm lint                # 运行 oxlint + eslint（自动修复）
pnpm format              # 使用 oxfmt 格式化 src/
```

## 环境变量与代理

开发环境可在 `.env.development` 配置：

```env
VITE_PROXY=[['/api','http://localhost:8080']]
```

`plugins/auto-proxy.ts` 会自动解析该配置并注入 Vite `server.proxy`。

## 代码规范

- 缩进 2 空格，LF 行尾，最大行宽 100（见 `.editorconfig`）。
- TypeScript + Vue SFC，字符串默认单引号、无分号（见 `.oxfmtrc.json`）。
- 组件命名建议 `PascalCase.vue`；组合式函数使用 `useXxx.ts`。
- API 文件按业务命名，如 `src/api/user.ts`、`src/api/role.ts`。

## 测试与质量门禁

当前仓库未配置单元测试框架。合并前请至少确保：

1. `pnpm type-check` 通过
2. `pnpm lint` 通过
3. 关键流程手测通过（登录、动态路由、权限页面跳转）

## 提交与 PR 规范

当前历史提交较少（`init: first commit`），建议后续采用 **Conventional Commits**：

- `feat: 新增角色批量分配`
- `fix: 修复登录后动态路由重复注入`
- `refactor: 拆分请求拦截器逻辑`

PR 建议包含：

- 变更摘要与影响范围
- 关联 issue（如有）
- UI 改动截图（前后对比）
- 本地验证结果（命令与结论）
