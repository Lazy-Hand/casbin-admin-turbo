# Vite Auto Proxy

为 monorepo 内的 Vite 应用提供统一的代理插件。

使用方式：

```ts
import { autoProxyPlugin } from '@casbin-admin/vite-auto-proxy'

autoProxyPlugin(env.VITE_PROXY)
```

环境变量格式：

```env
VITE_PROXY=[["/api","http://localhost:8080"]]
```
