# 多阶段构建 - Frontend Dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置和 lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services/backend ./services/backend
COPY apps/frontend ./apps/frontend

# 安装依赖并构建
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @casbin-admin/frontend build

# 第二阶段：Nginx 静态服务
FROM nginx:alpine AS production

# 复制构建好的静态文件
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
