import type { Plugin, ProxyOptions } from 'vite'

type ProxyList = [string, string][]

/**
 * 解析 .env 中的代理配置
 * 支持格式: [["/api","http://localhost:3000"],["/upload","http://cdn.com"]]
 * @param list
 */
function parseProxyList(list: string | ProxyList = []): ProxyList {
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
 * @param config 代理配置列表或 JSON 字符串
 */
export function autoProxyPlugin(config?: string | ProxyList): Plugin {
  return {
    name: 'vite-plugin-auto-proxy',
    config(_userConfig) {
      const proxyList = parseProxyList(config)
      const proxy: Record<string, ProxyOptions> = {}

      proxyList.forEach(([prefix, target]) => {
        const isHttps = target.startsWith('https://')

        proxy[prefix] = {
          target: target,
          changeOrigin: true,
          secure: isHttps,
          rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
          // 可选：打印代理日志
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (_proxyReq, _req, _res) => {
              console.log(`[Proxy] ${_req.method} ${_req.url} -> ${target}${_proxyReq.path}`)
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
