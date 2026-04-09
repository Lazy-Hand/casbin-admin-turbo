# Casbin Admin Turbo - 部署文档

## 目录

- [服务器信息](#服务器信息)
- [项目结构](#项目结构)
- [部署架构](#部署架构)
- [服务管理](#服务管理)
- [环境变量](#环境变量)
- [部署命令](#部署命令)
- [数据库初始化](#数据库初始化)
- [访问地址](#访问地址)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 服务器信息

| 属性             | 值                     |
| ---------------- | ---------------------- |
| **服务器 IP**    | `117.72.207.111`       |
| **SSH 端口**     | `22`                   |
| **SSH 用户**     | `root`                 |
| **SSH 登录方式** | 密码登录               |
| **操作系统**     | Ubuntu 24.04           |
| **内核版本**     | Linux 6.8.0-53-generic |
| **项目部署路径** | `/opt/casbin-admin`    |

### SSH 连接示例

```bash
ssh root@117.72.207.111
# 或使用密码登录
sshpass -p 'YOUR_PASSWORD' ssh root@117.72.207.111
```

---

## 项目结构

```
/opt/casbin-admin/
├── apps/
│   └── frontend/                    # Vue 3 前端应用
│       ├── dist/                    # 构建产物（生产环境使用）
│       ├── Dockerfile               # 前端 Docker 配置
│       └── nginx.conf               # Nginx 配置
├── services/
│   └── backend/                      # NestJS 后端服务
│       ├── dist/                    # 构建产物
│       ├── src/                     # 源代码
│       ├── Dockerfile              # 后端 Docker 配置
│       ├── app.log                  # 后端运行日志
│       └── config/                 # 配置文件
├── packages/                        # 共享包
├── docker-compose.yml              # Docker Compose 配置
├── .env                            # 环境变量
├── .env.production                  # 生产环境变量
├── pnpm-lock.yaml
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 部署架构

### 架构图

```
                    ┌─────────────────────────────────────────────────┐
                    │                   服务器                         │
                    │                  117.72.207.111                   │
                    │                                                  │
                    │  ┌──────────────────────────────────────────┐   │
                    │  │              Nginx (80)                   │   │
                    │  │                                          │   │
                    │  │  ┌──────────────┐    ┌─────────────────┐  │   │
                    │  │  │   Frontend   │    │   API Proxy     │  │   │
                    │  │  │  (静态文件)   │    │   /api/*        │  │   │
                    │  │  │ /opt/casbin- │    │   /api-docs     │  │   │
                    │  │  │ admin/apps/  │    │   /reference    │  │   │
                    │  │  │ frontend/dist│    │                 │  │   │
                    │  │  └──────────────┘    └────────┬────────┘  │   │
                    │  └─────────────────────────────│───────────┘   │
                    │                                    │             │
                    │  ┌─────────────────────────────────▼───────────┐ │
                    │  │         Node.js Backend (8080)            │ │
                    │  │                                          │ │ │
                    │  │  ┌────────────────────────────────────┐  │ │
                    │  │  │          NestJS Application        │  │ │
                    │  │  │   - CASL 权限控制                    │  │ │
                    │  │  │   - JWT 认证                         │  │ │
                    │  │  │   - Redis 会话缓存                   │  │ │
                    │  │  └────────────────────────────────────┘  │ │
                    │  └──────────────────────────────────────────┘ │
                    │                                                  │
                    │  ┌─────────────────┐  ┌─────────────────────┐  │
                    │  │   PostgreSQL    │  │       Redis         │  │
                    │  │   (Docker:5432)  │  │    (Docker:6379)    │  │
                    │  │  casbin-postgres │  │   casbin-redis     │  │
                    │  └─────────────────┘  └─────────────────────┘  │
                    └─────────────────────────────────────────────────┘
```

### 端口映射

| 端口 | 服务       | 说明                | 访问范围    |
| ---- | ---------- | ------------------- | ----------- |
| 80   | Nginx      | 前端 + API 反向代理 | 公网        |
| 8080 | Node.js    | 后端 API            | 本地        |
| 5432 | PostgreSQL | 数据库              | Docker 内部 |
| 6379 | Redis      | 缓存                | 本地        |

---

## 服务管理

### 服务状态检查

```bash
# SSH 连接到服务器
ssh root@117.72.207.111

# 检查所有服务状态
systemctl status nginx
docker ps

# 检查后端进程
ps aux | grep node | grep -v grep

# 检查后端日志
tail -f /opt/casbin-admin/services/backend/app.log

# 检查 API 是否可访问
curl http://127.0.0.1:8080/api
```

### 服务启动/停止

```bash
# Nginx 服务
systemctl start nginx
systemctl stop nginx
systemctl restart nginx

# PostgreSQL (Docker)
docker start casbin-postgres
docker stop casbin-postgres

# Redis (Docker)
docker start casbin-redis
docker stop casbin-redis

# 后端服务 (手动管理进程)
# 启动后端
cd /opt/casbin-admin
pnpm --filter @casbin-admin/backend build
cd services/backend
NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &

# 重启后端
pkill -f "node dist/src/main.js"
cd /opt/casbin-admin
pnpm --filter @casbin-admin/backend build
cd services/backend
NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &
```

---

## 环境变量

### 生产环境变量 (`.env.production`)

```bash
# 数据库密码 - 生产环境请务必修改为强密码
DB_PASSWORD=123456

# JWT 密钥 - 生产环境请务必修改为至少32位的随机字符串
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 本地环境变量 (`.env`)

```bash
# 数据库密码
DB_PASSWORD=123456

# Redis 密码
REDIS_PASSWORD=123456

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 环境变量生效

修改环境变量后需要重启后端服务：

```bash
cd /opt/casbin-admin/services/backend
pkill -f "node dist"
NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &
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

# 4. 安装依赖
pnpm install

# 5. 构建后端
pnpm --filter @casbin-admin/backend build

# 6. 构建前端
pnpm --filter @casbin-admin/frontend build

# 7. 启动/重启后端服务
cd /opt/casbin-admin/services/backend
pkill -f "node dist"
NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &

# 8. 验证部署
curl http://127.0.0.1:8080/api
```

### 仅更新后端

```bash
cd /opt/casbin-admin
pnpm --filter @casbin-admin/backend build
cd services/backend
pkill -f "node dist"
NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &
```

### 仅更新前端

```bash
cd /opt/casbin-admin
pnpm --filter @casbin-admin/frontend build
```

### 数据库初始化

使用项目中的 `data.sql` 文件初始化数据库：

```bash
# 1. 确保 PostgreSQL 容器正在运行
docker ps | grep casbin-postgres

# 2. 创建数据库（如不存在）
docker exec casbin-postgres psql -U postgres -c 'CREATE DATABASE casbin_admin;'

# 3. 上传 data.sql 文件到服务器
scp /path/to/project/services/backend/data.sql root@117.72.207.111:/tmp/data.sql

# 4. 导入数据
docker exec -i casbin-postgres psql -U postgres -d casbin_admin < /tmp/data.sql

# 5. 验证导入
docker exec casbin-postgres psql -U postgres -d casbin_admin -c '\dt'
```

**data.sql 文件位置**: `services/backend/data.sql`

---

## 访问地址

| 服务                | 地址                            |
| ------------------- | ------------------------------- |
| **前端应用**        | http://117.72.207.111           |
| **后端 API**        | http://117.72.207.111/api       |
| **Swagger 文档**    | http://117.72.207.111/api-docs  |
| **Scalar API 文档** | http://117.72.207.111/reference |

---

## 故障排查

### 常见问题

#### 1. 后端服务无法启动

```bash
# 检查端口是否被占用
lsof -i :8080

# 检查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 检查 pnpm 版本
pnpm --version  # 需要 >= 8.0.0

# 查看错误日志
cat /opt/casbin-admin/services/backend/app.log
```

#### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 容器状态
docker ps | grep postgres

# 检查 PostgreSQL 日志
docker logs casbin-postgres --tail 50

# 测试数据库连接
docker exec -it casbin-postgres psql -U postgres -d casbin_admin -c "SELECT 1;"

# 检查数据库是否存在
docker exec -it casbin-postgres psql -U postgres -l
```

#### 3. Redis 连接失败

```bash
# 检查 Redis 容器状态
docker ps | grep redis

# 检查 Redis 日志
docker logs casbin-redis --tail 50

# 测试 Redis 连接
docker exec -it casbin-redis redis-cli -a 123456 ping
```

#### 4. 前端无法访问

```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 检查静态文件是否存在
ls -la /opt/casbin-admin/apps/frontend/dist/

# 检查 Nginx 配置
nginx -t
```

#### 5. API 返回 502/504

```bash
# 检查后端是否运行
ps aux | grep node

# 检查后端日志
tail -100 /opt/casbin-admin/services/backend/app.log

# 测试直接访问后端
curl http://127.0.0.1:8080/api
```

### 日志文件位置

| 日志            | 路径                                         |
| --------------- | -------------------------------------------- |
| 后端日志        | `/opt/casbin-admin/services/backend/app.log` |
| Nginx 错误日志  | `/var/log/nginx/error.log`                   |
| Nginx 访问日志  | `/var/log/nginx/access.log`                  |
| PostgreSQL 日志 | `docker logs casbin-postgres`                |
| Redis 日志      | `docker logs casbin-redis`                   |

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
4. **启用 HTTPS** - 配置 SSL/TLS 证书
5. **定期更新** - 保持系统和依赖更新

---

## 快速参考

```bash
# 连接服务器
ssh root@117.72.207.111

# 检查服务状态
docker ps && systemctl status nginx && ps aux | grep node

# 查看日志
tail -f /opt/casbin-admin/services/backend/app.log

# 重启后端
cd /opt/casbin-admin/services/backend && pkill -f "node dist" && NODE_ENV=production nohup node dist/src/main.js > app.log 2>&1 &

# 重启 Nginx
systemctl restart nginx

# 重启数据库服务
docker restart casbin-postgres casbin-redis
```

---

_本文档最后更新于 2026-04-09_
