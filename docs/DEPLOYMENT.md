# Casbin Admin Turbo - Docker 部署文档

## 目录

- [概述](#概述)
- [服务器信息](#服务器信息)
- [项目结构](#项目结构)
- [部署架构](#部署架构)
- [环境变量](#环境变量)
- [部署命令](#部署命令)
- [数据库初始化](#数据库初始化)
- [访问地址](#访问地址)
- [服务管理](#服务管理)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 概述

本项目采用 Docker 容器化部署，所有服务通过 Docker Compose 进行管理。

**包含服务：**

- **PostgreSQL 16** - 关系数据库
- **Redis 7** - 缓存和会话存储
- **Backend (NestJS)** - API 服务
- **Frontend (Vue 3 + Nginx)** - 前端应用

---

## 服务器信息

| 属性                    | 值                     |
| ----------------------- | ---------------------- |
| **服务器 IP**           | `117.72.207.111`       |
| **SSH 端口**            | `22`                   |
| **SSH 用户**            | `root`                 |
| **SSH 登录方式**        | 密码登录               |
| **操作系统**            | Ubuntu 24.04           |
| **内核版本**            | Linux 6.8.0-53-generic |
| **项目部署路径**        | `/opt/casbin-admin`    |
| **Docker 版本**         | 24.0+                  |
| **Docker Compose 版本** | 2.0+                   |

### 前置要求

确保服务器已安装 Docker 和 Docker Compose：

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version
```

### 安装 Docker（如未安装）

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
apt update && apt install -y docker-compose-v2

# 将当前用户加入 docker 组（免 sudo）
usermod -aG docker $USER
```

### SSH 连接示例

```bash
ssh root@117.72.207.111
```

---

## 项目结构

```
/opt/casbin-admin/
├── apps/
│   └── frontend/
│       ├── Dockerfile          # 前端镜像构建配置
│       ├── nginx.conf           # Nginx 配置
│       └── dist/                # 构建产物（容器内）
├── services/
│   └── backend/
│       ├── Dockerfile           # 后端镜像构建配置
│       ├── dist/                # 构建产物（容器内）
│       └── data.sql             # 数据库初始化脚本
├── packages/                    # 共享包
├── docker-compose.yml           # 容器编排配置
├── .env                         # 环境变量
├── .dockerignore               # Docker 构建排除文件
├── pnpm-lock.yaml
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 部署架构

### 架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            服务器 117.72.207.111                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Docker Network (casbin-network)               │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              Frontend (casbin-frontend)                    │  │  │
│  │  │                   Nginx :80                                 │  │  │
│  │  │     ┌─────────────────────────────────────────────────┐    │  │  │
│  │  │     │          Vue 3 静态资源                          │    │  │  │
│  │  │     │     /          → index.html                      │    │  │  │
│  │  │     │     /api/*    → 代理到 backend:8080              │    │  │  │
│  │  │     └─────────────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                              ↕                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              Backend (casbin-backend)                       │  │  │
│  │  │                   NestJS :8080                              │  │  │
│  │  │     ┌─────────────────────────────────────────────────┐    │  │  │
│  │  │     │   CASL 权限控制  │  JWT 认证  │  Redis 会话    │    │  │  │
│  │  │     └─────────────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                              ↕                                     │  │
│  │  ┌──────────────────┐    ┌──────────────────────────────────┐    │  │
│  │  │ PostgreSQL :5432  │    │          Redis :6379             │    │  │
│  │  │ casbin-postgres   │    │         casbin-redis             │    │  │
│  │  │ (postgres_data)   │    │        (redis_data)              │    │  │
│  │  └──────────────────┘    └──────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 端口映射

| 端口 | 容器端口 | 服务           | 访问范围 | 说明                |
| ---- | -------- | -------------- | -------- | ------------------- |
| 80   | 80       | Frontend/Nginx | 公网     | 前端 + API 反向代理 |
| 5432 | 5432     | PostgreSQL     | 本地     | Docker 内部网络访问 |
| 6379 | 6379     | Redis          | 本地     | 仅本地 (127.0.0.1)  |
| 8080 | 8080     | Backend        | 本地     | 仅本地 (127.0.0.1)  |

---

## 环境变量

### 创建环境变量文件

在服务器上创建 `.env` 文件：

```bash
cd /opt/casbin-admin
nano .env
```

### 环境变量配置

```bash
# 数据库密码 - 生产环境请务必修改为强密码
DB_PASSWORD=123456

# Redis 密码 - 生产环境请务必修改为强密码
REDIS_PASSWORD=123456

# JWT 密钥 - 生产环境请务必修改为至少32位的随机字符串
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 生成随机密钥示例

```bash
# 生成随机 JWT 密钥
openssl rand -base64 32
```

---

## 部署命令

### 完整部署流程

```bash
# 1. SSH 连接到服务器
ssh root@117.72.207.111

# 2. 进入项目目录
cd /opt/casbin-admin

# 3. 拉取最新代码（如果使用 Git）
git pull

# 4. 创建环境变量文件（如果不存在）
cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
DB_PASSWORD=123456
REDIS_PASSWORD=123456
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF

# 5. 构建并启动所有服务
docker compose up -d --build

# 6. 查看服务状态
docker compose ps

# 7. 查看日志
docker compose logs -f

# 8. 验证部署
curl http://127.0.0.1/api
```

### 仅更新后端

```bash
cd /opt/casbin-admin
docker compose up -d --build backend
docker compose logs -f backend
```

### 仅更新前端

```bash
cd /opt/casbin-admin
docker compose up -d --build frontend
docker compose logs -f frontend
```

### 重新创建所有服务

```bash
cd /opt/casbin-admin
docker compose down
docker compose up -d --build
```

---

## 数据库初始化

### 首次部署

PostgreSQL 容器首次启动时会自动创建 `casbin_admin` 数据库。

### 导入数据

如需导入初始数据：

```bash
# 1. 将 data.sql 上传到服务器
scp services/backend/data.sql root@117.72.207.111:/tmp/data.sql

# 2. 导入数据
docker exec -i casbin-postgres psql -U postgres -d casbin_admin < /tmp/data.sql

# 3. 验证导入
docker exec casbin-postgres psql -U postgres -d casbin_admin -c '\dt'
```

**data.sql 文件位置**: `services/backend/data.sql`

### 运行数据库迁移

```bash
cd /opt/casbin-admin

# 生成迁移（如有 schema 变更）
docker compose exec backend pnpm --filter @casbin-admin/backend db:generate

# 运行迁移
docker compose exec backend pnpm --filter @casbin-admin/backend db:migrate
```

---

## 访问地址

| 服务                | 地址                            |
| ------------------- | ------------------------------- |
| **前端应用**        | http://117.72.207.111           |
| **后端 API**        | http://117.72.207.111/api       |
| **Swagger 文档**    | http://117.72.207.111/api-docs  |
| **Scalar API 文档** | http://117.72.207.111/reference |

---

## 服务管理

### 启动/停止服务

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

### 查看服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止）
docker ps -a
```

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看后端日志
docker compose logs -f backend

# 查看前端的实时日志
docker compose logs -f frontend

# 查看最近 100 行日志
docker compose logs --tail 100 backend

# 查看特定容器的日志
docker logs casbin-backend -f
```

### 进入容器

```bash
# 进入后端容器
docker exec -it casbin-backend sh

# 进入 PostgreSQL 容器
docker exec -it casbin-postgres psql -U postgres -d casbin_admin

# 进入 Redis 容器
docker exec -it casbin-redis redis-cli -a 123456
```

### 清理资源

```bash
# 删除未使用的镜像
docker image prune -f

# 删除未使用的卷
docker volume prune -f

# 完全清理（停止所有容器后）
docker system prune -af
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看容器状态
docker compose ps -a

# 查看启动日志
docker compose logs backend

# 检查端口是否被占用
lsof -i :80
lsof -i :5432
```

#### 2. 后端容器无法连接数据库

```bash
# 检查 PostgreSQL 是否就绪
docker compose exec postgres pg_isready -U postgres

# 检查网络连通性
docker compose exec backend ping postgres

# 查看 PostgreSQL 日志
docker compose logs postgres
```

#### 3. 数据库连接失败

```bash
# 检查 PostgreSQL 容器状态
docker compose ps postgres

# 检查 PostgreSQL 日志
docker compose logs postgres

# 测试数据库连接
docker compose exec postgres psql -U postgres -d casbin_admin -c "SELECT 1;"

# 检查数据库是否存在
docker compose exec postgres psql -U postgres -l
```

#### 4. Redis 连接失败

```bash
# 检查 Redis 容器状态
docker compose ps redis

# 检查 Redis 日志
docker compose logs redis

# 测试 Redis 连接
docker compose exec redis redis-cli -a 123456 ping
```

#### 5. 前端无法访问

```bash
# 检查 Nginx 容器状态
docker compose ps frontend

# 检查 Nginx 错误日志
docker compose logs frontend

# 进入容器检查配置
docker compose exec frontend nginx -t
```

#### 6. API 返回 502/504

```bash
# 检查后端是否运行
docker compose ps backend

# 检查后端健康状态
curl http://127.0.0.1:8080/api

# 查看后端日志
docker compose logs backend --tail 100
```

### 日志文件位置

| 服务            | 查看命令                          |
| --------------- | --------------------------------- |
| 所有服务日志    | `docker compose logs -f`          |
| 后端日志        | `docker compose logs -f backend`  |
| 前端日志        | `docker compose logs -f frontend` |
| PostgreSQL 日志 | `docker compose logs -f postgres` |
| Redis 日志      | `docker compose logs -f redis`    |

### Docker 网络检查

```bash
# 查看网络
docker network ls

# 查看 casbin-network 详情
docker network inspect casbin-admin_casbin-network
```

---

## 安全建议

### 必须修改的配置

在生产环境中，以下配置**必须**修改：

1. **数据库密码**

   ```bash
   # 建议使用至少 16 位的强密码
   DB_PASSWORD=<至少16位强密码>
   ```

2. **Redis 密码**

   ```bash
   # 建议使用至少 16 位的强密码
   REDIS_PASSWORD=<至少16位强密码>
   ```

3. **JWT 密钥**

   ```bash
   # 建议使用至少 32 位的随机字符串
   JWT_SECRET=<随机生成的32位字符串>
   # 生成示例: openssl rand -base64 32
   ```

### 安全加固建议

1. **修改 SSH 端口** - 将默认的 22 端口改为其他端口
2. **禁用密码登录** - 使用 SSH 密钥登录
3. **配置防火墙** - 仅开放必要的端口 (80, 443)
4. **启用 HTTPS** - 使用 Let's Encrypt 配置 SSL/TLS 证书
5. **定期更新** - 保持 Docker 镜像和系统更新
6. **限制外部访问** - 将 5432、6379、8080 端口绑定到 127.0.0.1

---

## 快速参考

```bash
# 连接服务器
ssh root@117.72.207.111

# 进入项目目录
cd /opt/casbin-admin

# 部署/更新
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启后端
docker compose restart backend

# 完全重建
docker compose down && docker compose up -d --build
```

---

_本文档最后更新于 2026-04-09_
