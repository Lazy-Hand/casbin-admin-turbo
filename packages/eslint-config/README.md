# @casbin-admin/eslint-config

`packages/eslint-config` 是本仓库的共享 ESLint 配置包，用来统一前后端的基础 lint 规则，同时允许各应用保留自己的局部规则。

## 目标

- 统一通用 TypeScript / ESLint 工具链版本
- 统一 `oxlint` 与 `eslint-config-prettier` 的接法
- 避免 frontend / backend 各自复制大段 ESLint 配置

## 导出内容

- `@casbin-admin/eslint-config/base`
- `@casbin-admin/eslint-config/node`
- `@casbin-admin/eslint-config/vue`

## 当前职责

- `base.js`: 通用 ignore、共享 TS 规则、`oxlint` / prettier 辅助函数
- `node.js`: 提供 Node / Nest 风格的 ESLint 组合函数
- `vue.js`: 提供 Vue + TypeScript 风格的 ESLint 组合函数

## 使用方式

backend 示例：

```js
import { createNodeConfig } from '@casbin-admin/eslint-config/node';

export default createNodeConfig();
```

frontend 示例：

```js
import { createVueConfig } from '@casbin-admin/eslint-config/vue';

export default createVueConfig();
```

## 维护约定

- 这里优先放“跨包共享”的 ESLint 逻辑，不放业务规则
- 应用目录下的 `eslint.config.*` 应保持薄包装，只保留局部 override
- 依赖版本优先通过 workspace `catalog` 管理
