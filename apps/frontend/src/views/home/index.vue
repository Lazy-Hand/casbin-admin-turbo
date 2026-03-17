<template>
  <div class="p-6 space-y-6">
    <section
      class="rounded-3xl border border-slate-200 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-8 shadow-sm"
    >
      <div class="flex items-start justify-between gap-6">
        <div class="space-y-4">
          <div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm text-slate-600">
            <AppIcon icon="antd:HomeOutlined" />
            固定首页
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl font-semibold text-slate-900">欢迎回来</h1>
            <p class="max-w-2xl text-slate-600">
              这是系统固定首页，不受数据库动态权限路由控制。首次登录且没有 `redirect` 时，会默认进入这里。
            </p>
          </div>
        </div>
        <div
          class="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg md:flex"
        >
          <AppIcon icon="antd:CompassOutlined" class="text-3xl" />
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-900">
          <AppIcon icon="antd:SafetyCertificateOutlined" class="text-sky-600" />
          <span class="font-medium">无需权限控制</span>
        </div>
        <p class="text-sm leading-6 text-slate-600">
          该页面作为系统固定入口，始终可访问，不依赖数据库中的菜单权限配置。
        </p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-900">
          <AppIcon icon="antd:PushpinOutlined" class="text-emerald-600" />
          <span class="font-medium">标签固定</span>
        </div>
        <p class="text-sm leading-6 text-slate-600">
          首页标签页会固定保留，不能被关闭，也会在“关闭其他 / 全部”时保留下来。
        </p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-900">
          <AppIcon icon="antd:ThunderboltOutlined" class="text-amber-500" />
          <span class="font-medium">默认登录落点</span>
        </div>
        <p class="text-sm leading-6 text-slate-600">
          如果登录前没有明确的 `redirect`，系统会优先跳转到这个固定首页。
        </p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'HomePage',
})
</script>
