# 多阶段构建 - Backend Dockerfile
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
    pnpm --filter @casbin-admin/backend build

# 第二阶段：生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制构建产物和依赖
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/backend/package.json ./services/backend/
COPY --from=builder /app/services/backend/dist ./services/backend/dist
COPY --from=builder /app/services/backend/node_modules ./services/backend/node_modules

WORKDIR /app/services/backend

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main"]
