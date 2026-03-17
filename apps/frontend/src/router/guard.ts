import type { Router } from "vue-router";
import { localCache } from "@/utils/storage";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useRouteStore } from "@/stores/route";

// Configure NProgress
NProgress.configure({ showSpinner: false });

const ALLOW_LIST = ["/login", "/404", "/401"];

export function createRouterGuard(router: Router) {
  router.beforeEach(async (to, from, _next) => {
    NProgress.start();

    const token = localCache.get("token");

    if (token) {
      // 已登录
      if (to.path === "/login") {
        // 已登录访问登录页，跳转到首页
        _next({ path: "/home" });
        return;
      }

      // 检查是否已加载动态路由
      const routeStore = useRouteStore();

      if (!routeStore.isLoaded) {
        // 首次访问，加载动态路由
        try {
          const { success } = await routeStore.loadDynamicRoutes(router);

          if (success) {
            // 路由已在 store 中注册，这里只需要重新导航命中新注册的记录
            _next({ ...to, replace: true });
          } else if (!localCache.get("token")) {
            // 401 场景由请求层弹框并引导重新登录，这里中断即可，避免先跳错误页
            _next(false);
          } else {
            // 加载失败或无权限，跳转到无权限页面
            _next("/401");
          }
        } catch (error) {
          console.error("Load dynamic routes error:", error);
          if (!localCache.get("token")) {
            _next(false);
          } else {
            _next("/401");
          }
        }
      } else {
        // 已加载，直接放行
        _next();
      }
    } else {
      // 未登录
      if (ALLOW_LIST.includes(to.path)) {
        _next();
      } else {
        _next(`/login?redirect=${to.fullPath}`);
      }
    }
  });

  router.afterEach(() => {
    NProgress.done();
  });
}
