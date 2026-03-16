/// <reference types="vite/client" />
type ProxyList = [string, string][]
interface ImportMetaEnv {
  VITE_PROXY: ProxyList
  VITE_API_BASE_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
