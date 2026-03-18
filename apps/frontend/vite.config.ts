import { fileURLToPath, URL } from "node:url";
import Components from "unplugin-vue-components/vite";
import { ProNaiveUIResolver } from "pro-naive-ui-resolver";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import { createIconsPlugin, createIconsResolver, resolveAppIconDir } from "@casbin-admin/icons/vite";
import { autoProxyPlugin } from "@casbin-admin/vite-auto-proxy";

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) {
    return;
  }

  if (
    id.includes("naive-ui") ||
    id.includes("vooks") ||
    id.includes("vueuc") ||
    id.includes("seemly")
  ) {
    return "naive-ui";
  }

  if (id.includes("pro-naive-ui")) {
    return "pro-naive-ui";
  }

  if (id.includes("@tiptap") || id.includes("prosemirror") || id.includes("quill")) {
    return "editor";
  }

  if (id.includes("vue-router")) {
    return "vue-router";
  }

  if (id.includes("/vue/") || id.includes("@vue")) {
    return "vue-core";
  }

  if (id.includes("dayjs")) {
    return "dayjs";
  }

  if (id.includes("pinia") || id.includes("@pinia") || id.includes("@tanstack")) {
    return "data";
  }

  if (id.includes("lucide-vue-next")) {
    return "icons";
  }
};
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const appIconDir = resolveAppIconDir(process.cwd());

  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      Components({
        dts: "types/components.d.ts",
        resolvers: [
          NaiveUiResolver(),
          ProNaiveUIResolver(),
          createIconsResolver({
            appIconDir,
          }),
        ],
      }),
      createIconsPlugin({
        appIconDir,
      }),
      tailwindcss({
        optimize: {
          minify: true,
        },
      }),
      AutoImport({
        dts: "types/auto-imports.d.ts",
        imports: [
          "vue",
          "vue-router",
          "pinia",
          {
            "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar"],
          },
        ],
      }),
      autoProxyPlugin(env.VITE_PROXY),
    ],
    server: {
      port: 7777,
      forwardConsole: true,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    devtools: {
      enabled: true,
    },
    build: {
      chunkSizeWarningLimit: 6500,
      rolldownOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
