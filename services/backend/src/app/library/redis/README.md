# Redis Module

Redis 服务模块，提供高性能的缓存和数据存储功能。

## 📁 文件结构

```
redis/
├── index.ts              # 导出模块
├── redis.module.ts       # Redis 模块定义
├── redis.service.ts      # Redis 服务实现
└── README.md            # 本文档
```

## 🚀 快速开始

### 1. 配置环境变量

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=app:
REDIS_ENABLE_PUBSUB=false
```

### 2. 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/app/library/redis';

@Injectable()
export class MyService {
  constructor(private readonly redis: RedisService) {}

  async example() {
    // 设置缓存
    await this.redis.set('key', { data: 'value' }, 3600);
    
    // 获取缓存
    const value = await this.redis.get('key');
    
    // 删除缓存
    await this.redis.del('key');
  }
}
```

## 📚 API 参考

### 基础操作

- `set(key, value, ttl?)` - 设置键值
- `get<T>(key)` - 获取键值
- `del(...keys)` - 删除键
- `exists(key)` - 检查键是否存在
- `expire(key, seconds)` - 设置过期时间
- `ttl(key)` - 获取剩余过期时间

### 批量操作

- `mget<T>(keys)` - 批量获取
- `mset(entries)` - 批量设置
- `delByPattern(pattern)` - 按模式删除

### Hash 操作

- `hset(key, field, value)` - 设置 Hash 字段
- `hget<T>(key, field)` - 获取 Hash 字段
- `hgetall<T>(key)` - 获取所有字段
- `hdel(key, ...fields)` - 删除字段

### List 操作

- `lpush(key, ...values)` - 从左侧推入
- `rpush(key, ...values)` - 从右侧推入
- `lpop<T>(key)` - 从左侧弹出
- `lrange<T>(key, start, stop)` - 获取范围

### Set 操作

- `sadd(key, ...members)` - 添加到集合
- `smembers<T>(key)` - 获取所有成员
- `srem(key, ...members)` - 移除成员

### 发布订阅

- `publish(channel, message)` - 发布消息
- `subscribe(channel, callback)` - 订阅频道
- `unsubscribe(channel)` - 取消订阅

### 工具方法

- `getClient()` - 获取原始客户端
- `ping()` - 测试连接
- `dbsize()` - 获取数据库大小
- `flushdb()` - 清空数据库

## 🎯 使用场景

### 1. 缓存

```typescript
async cacheData(key: string, data: any) {
  await this.redis.set(key, data, 3600); // 1小时
}
```

### 2. 会话存储

```typescript
async saveSession(token: string, session: any) {
  await this.redis.set(`session:${token}`, session, 86400); // 24小时
}
```

### 3. 限流

```typescript
async checkRateLimit(userId: number): Promise<boolean> {
  const key = `rate:${userId}`;
  const client = this.redis.getClient();
  const count = await client.incr(key);
  
  if (count === 1) {
    await client.expire(key, 60); // 1分钟
  }
  
  return count <= 100; // 每分钟最多100次
}
```

### 4. 分布式锁

```typescript
async acquireLock(resource: string): Promise<string | null> {
  const lockKey = `lock:${resource}`;
  const lockValue = `${Date.now()}`;
  const client = this.redis.getClient();
  
  const result = await client.set(lockKey, lockValue, 'EX', 10, 'NX');
  return result === 'OK' ? lockValue : null;
}
```

## 🔧 高级用法

### 使用原始客户端

```typescript
const client = this.redis.getClient();
await client.zadd('leaderboard', 100, 'user1');
```

### 使用 Pipeline

```typescript
const client = this.redis.getClient();
const pipeline = client.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

### 使用事务

```typescript
const client = this.redis.getClient();
await client.multi()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .exec();
```

## 📖 完整文档

查看 [Redis 集成指南](../../../../docs/api/REDIS_GUIDE.md) 获取完整文档。

## 🎉 特性

- ✅ 全局模块，无需重复导入
- ✅ 自动 JSON 序列化/反序列化
- ✅ 支持 TypeScript 类型推断
- ✅ 完整的错误处理
- ✅ 连接重试机制
- ✅ 支持发布订阅
- ✅ 支持所有 Redis 数据类型
- ✅ 提供原始客户端访问
