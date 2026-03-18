import type { Plugin, ProxyOptions } from 'vite'

export type ProxyList = [string, string][]

/**
 * 解析 .env 中的代理配置
 * 支持格式: [["/api","http://localhost:3000"],["/upload","http://cdn.com"]]
 */
export function parseProxyList(list: string | ProxyList = []): ProxyList {
  try {
    if (typeof list === 'string') {
      return JSON.parse(list.replace(/'/g, '"'))
    }

    return list
  } catch (error) {
    console.error('Proxy config parse error:', error)
    return []
  }
}

/**
 * 自动代理插件
 */
export function autoProxyPlugin(config?: string | ProxyList): Plugin {
  return {
    name: 'vite-plugin-auto-proxy',
    config() {
      const proxyList = parseProxyList(config)
      const proxy: Record<string, ProxyOptions> = {}

      proxyList.forEach(([prefix, target]) => {
        const isHttps = target.startsWith('https://')

        proxy[prefix] = {
          target,
          changeOrigin: true,
          secure: isHttps,
          rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
          configure: (proxyServer) => {
            proxyServer.on('proxyReq', (proxyReq, req) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${target}${proxyReq.path}`)
            })
          },
        }
      })

      return {
        server: {
          proxy,
        },
      }
    },
  }
}
