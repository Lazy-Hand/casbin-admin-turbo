import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { autoProxyPlugin } from '@casbin-admin/vite-auto-proxy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react(), tailwindcss(), autoProxyPlugin(env.VITE_PROXY)],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 7778,
      forwardConsole: true,
    },
  }
})
