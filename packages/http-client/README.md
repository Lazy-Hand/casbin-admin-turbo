# @casbin-admin/http-client

`@casbin-admin/http-client` 是 monorepo 内部的公共 HTTP 基础包，负责封装 axios 传输层能力，并为上层应用提供统一的请求工厂。

## 设计目标

- 复用 axios 核心能力，不把实现散落在业务应用里
- 保持传输层和业务协议层边界清晰
- 支持业务码判断、401 回调、错误提醒、重试策略
- 给 frontend 等消费方保留一层很薄的本地适配

## 包含内容

- `createRequest(config)`
- `RequestHttp`
- `HttpClientError`
- `checkStatus`
- `isResponseData`
- `isBusinessSuccess`
- `RequestConfig`
- `ResponseData`
- `PageResponse`

## 推荐分层

公共包负责：

- axios 实例创建
- 请求/响应拦截
- 重试策略
- 原始响应与业务响应两套方法
- 统一错误包装

应用适配层负责：

- token 从哪里取
- 401 跳到哪里
- Message / Dialog / Toast 如何展示
- baseURL 从哪个环境变量读取

## 基础用法

```ts
import { createRequest, type RequestConfig } from '@casbin-admin/http-client'

const requestConfig = {
  baseURL: '/api',
  getToken: () => localStorage.getItem('token'),
  onUnauthorized: () => {
    // 跳转登录页
  },
  onErrorAlert: (msg) => {
    console.error(msg)
  },
} satisfies RequestConfig

export const http = createRequest(requestConfig)
```

## 业务响应模式

默认请求方法会把响应当成这类结构处理：

```ts
type ResponseData<T> = {
  code: number
  data: T
  message: string
  msg?: string
}
```

默认成功码：

- `0`
- `200`

可通过 `successCodes` 或 `isBusinessSuccess` 覆盖。

## 原始响应模式

如果你需要拿原始 axios response，请使用：

- `rawGet`
- `rawPost`
- `rawPut`
- `rawPatch`
- `rawDelete`
- `rawDownload`
- `rawRequest`

这类方法不会走业务码解包。

## 错误模型

包内统一抛出 `HttpClientError`，按来源分为：

- `business`
- `http`
- `network`
- `unknown`

常用字段：

- `kind`
- `status`
- `businessCode`
- `response`
- `payload`
- `originalError`

## Retry 策略

启用 `enableRetry` 后，默认只会重试：

- 网络错误
- `5xx`
- `GET / HEAD / OPTIONS`

可通过以下配置扩展：

- `retryMethods`
- `shouldRetry`

## 校验方式

- `pnpm --filter @casbin-admin/http-client type-check`
- `pnpm --filter @casbin-admin/http-client smoke-check`
- `pnpm --filter @casbin-admin/http-client test`

其中：

- `smoke-check` 用于快速验证导出和基础行为
- `test` 会先构建 `dist`，再直接跑 Node 单测，确保包产物本身可被消费

## 当前消费方

- `apps/frontend`

frontend 中建议只保留一层 `src/utils/request/index.ts` 作为项目适配入口，不要把路由、缓存、消息提示直接写回这个包。
