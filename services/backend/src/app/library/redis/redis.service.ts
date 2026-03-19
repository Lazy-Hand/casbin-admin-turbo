import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Service
 * 提供 Redis 客户端和常用操作方法
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly subscriber?: Redis;
  private readonly publisher?: Redis;

  constructor(private configService: ConfigService) {
    // 获取 Redis 配置
    const redisConfig: RedisOptions = {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db', 0),
      keyPrefix: this.configService.get<string>('redis.keyPrefix', 'app:'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    // 创建主客户端
    this.client = new Redis(redisConfig);

    // 监听连接事件
    this.client.on('connect', () => {
      this.logger.log('Redis 连接成功');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis 连接错误:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis 连接关闭');
    });

    // 如果启用了 pub/sub，创建专用连接
    if (this.configService.get<boolean>('redis.enablePubSub', false)) {
      this.subscriber = new Redis(redisConfig);
      this.publisher = new Redis(redisConfig);
      this.logger.log('Redis Pub/Sub 已启用');
    }
  }

  /**
   * 获取 Redis 客户端实例
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 获取订阅客户端
   */
  getSubscriber(): Redis | undefined {
    return this.subscriber;
  }

  /**
   * 获取发布客户端
   */
  getPublisher(): Redis | undefined {
    return this.publisher;
  }

  // ==================== 基础操作 ====================

  /**
   * 设置键值
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * 获取键值
   * @param key 键
   * @returns 值
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * 删除键
   * @param keys 键或键数组
   */
  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  /**
   * 检查键是否存在
   * @param key 键
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   * @param key 键
   * @param seconds 秒数
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * 获取剩余过期时间
   * @param key 键
   * @returns 剩余秒数，-1 表示永不过期，-2 表示键不存在
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // ==================== 批量操作 ====================

  /**
   * 批量获取
   * @param keys 键数组
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) {
      return [];
    }
    const values = await this.client.mget(...keys);
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  /**
   * 批量设置
   * @param entries 键值对数组
   */
  async mset(entries: Array<{ key: string; value: any }>): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const args: string[] = [];
    for (const { key, value } of entries) {
      args.push(key, JSON.stringify(value));
    }
    await this.client.mset(...args);
  }

  /**
   * 按模式删除键
   * @param pattern 模式，如 'user:*'
   */
  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  // ==================== Hash 操作 ====================

  /**
   * 设置 Hash 字段
   * @param key 键
   * @param field 字段
   * @param value 值
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  /**
   * 获取 Hash 字段
   * @param key 键
   * @param field 字段
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * 获取 Hash 所有字段
   * @param key 键
   */
  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    const data = await this.client.hgetall(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch {
        result[field] = value as T;
      }
    }
    return result;
  }

  /**
   * 删除 Hash 字段
   * @param key 键
   * @param fields 字段数组
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hdel(key, ...fields);
  }

  // ==================== List 操作 ====================

  /**
   * 从左侧推入列表
   * @param key 键
   * @param values 值数组
   */
  async lpush(key: string, ...values: any[]): Promise<number> {
    const serialized = values.map((v) => JSON.stringify(v));
    return await this.client.lpush(key, ...serialized);
  }

  /**
   * 从右侧推入列表
   * @param key 键
   * @param values 值数组
   */
  async rpush(key: string, ...values: any[]): Promise<number> {
    const serialized = values.map((v) => JSON.stringify(v));
    return await this.client.rpush(key, ...serialized);
  }

  /**
   * 从左侧弹出列表
   * @param key 键
   */
  async lpop<T = any>(key: string): Promise<T | null> {
    const value = await this.client.lpop(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * 获取列表范围
   * @param key 键
   * @param start 起始索引
   * @param stop 结束索引
   */
  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const values = await this.client.lrange(key, start, stop);
    return values.map((value) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  /**
   * 裁剪列表
   * @param key 键
   * @param start 起始索引
   * @param stop 结束索引
   */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.ltrim(key, start, stop);
  }

  /**
   * 原子批量弹出列表左侧元素
   * @param key 键
   * @param count 数量
   */
  async drainList<T = any>(key: string, count: number): Promise<T[]> {
    if (count <= 0) {
      return [];
    }

    const values = await this.client.lpop(key, count);
    if (!values) {
      return [];
    }

    const items = Array.isArray(values) ? values : [values];
    return items.map((value) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  // ==================== Set 操作 ====================

  /**
   * 添加到集合
   * @param key 键
   * @param members 成员数组
   */
  async sadd(key: string, ...members: any[]): Promise<number> {
    const serialized = members.map((m) => JSON.stringify(m));
    return await this.client.sadd(key, ...serialized);
  }

  /**
   * 获取集合所有成员
   * @param key 键
   */
  async smembers<T = any>(key: string): Promise<T[]> {
    const values = await this.client.smembers(key);
    return values.map((value) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  /**
   * 从集合移除成员
   * @param key 键
   * @param members 成员数组
   */
  async srem(key: string, ...members: any[]): Promise<number> {
    const serialized = members.map((m) => JSON.stringify(m));
    return await this.client.srem(key, ...serialized);
  }

  // ==================== 发布订阅 ====================

  /**
   * 发布消息
   * @param channel 频道
   * @param message 消息
   */
  async publish(channel: string, message: any): Promise<number> {
    if (!this.publisher) {
      throw new Error('Redis Pub/Sub 未启用');
    }
    return await this.publisher.publish(channel, JSON.stringify(message));
  }

  /**
   * 订阅频道
   * @param channel 频道
   * @param callback 回调函数
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis Pub/Sub 未启用');
    }
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  }

  /**
   * 取消订阅
   * @param channel 频道
   */
  async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis Pub/Sub 未启用');
    }
    await this.subscriber.unsubscribe(channel);
  }

  // ==================== 工具方法 ====================

  /**
   * 清空当前数据库
   */
  async flushdb(): Promise<void> {
    await this.client.flushdb();
    this.logger.warn('Redis 数据库已清空');
  }

  /**
   * 获取数据库大小
   */
  async dbsize(): Promise<number> {
    return await this.client.dbsize();
  }

  /**
   * Ping
   */
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  /**
   * 模块销毁时断开连接
   */
  async onModuleDestroy() {
    await this.client.quit();
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    if (this.publisher) {
      await this.publisher.quit();
    }
    this.logger.log('Redis 连接已关闭');
  }
}
