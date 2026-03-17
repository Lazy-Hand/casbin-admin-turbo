import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { RedisService } from '@/app/library/redis/redis.service';
import { CreateConfigDto, UpdateConfigDto, ConfigQueryDto } from './dto/config.dto';
import {
  DrizzleService,
  SysConfig,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '../../library/drizzle';

const CONFIG_CACHE_PREFIX = 'config:';
const CONFIG_CACHE_TTL = 86400; // 24 hours

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly redis: RedisService,
  ) {}

  /** 获取缓存键 */
  private getCacheKey(key: string): string {
    return `${CONFIG_CACHE_PREFIX}${key}`;
  }

  /** 分页查询配置 */
  async findPage(dto: ConfigQueryDto) {
    const { pageNo = 1, pageSize = 10, configKey, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const where = and(
      withSoftDelete(SysConfig),
      configKey ? ilike(SysConfig.configKey, `%${configKey}%`) : undefined,
      status !== undefined ? eq(SysConfig.status, status) : undefined,
    );

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select()
        .from(SysConfig)
        .where(where)
        .orderBy(desc(SysConfig.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({ total: sql<number>`count(*)` })
        .from(SysConfig)
        .where(where),
    ]);

    return { list, total: total[0]?.total ?? 0, pageNo, pageSize };
  }

  /** 获取所有启用的配置 (不缓存) */
  async findAll() {
    return this.drizzle.db
      .select()
      .from(SysConfig)
      .where(and(withSoftDelete(SysConfig), eq(SysConfig.status, 1)))
      .orderBy(desc(SysConfig.createdAt));
  }

  /** 根据 ID 获取配置详情 */
  async findOne(id: number) {
    const config = await this.drizzle.findFirst(SysConfig, eq(SysConfig.id, id));
    if (!config) {
      throw new NotFoundException(`配置 ID=${id} 不存在`);
    }
    return config;
  }

  /** 根据 key 获取配置值 (带缓存) */
  async getByKey(key: string): Promise<string | null> {
    const cacheKey = this.getCacheKey(key);

    // 1. 尝试从缓存获取
    try {
      const cached = await this.redis.get<string>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Redis get failed for key ${key}, falling back to DB`, error);
    }

    // 2. 从数据库获取
    const config = await this.drizzle.findFirst(
      SysConfig,
      and(
        eq(SysConfig.configKey, key),
        eq(SysConfig.status, 1),
      ),
    );

    if (!config) {
      return null;
    }

    // 3. 写入缓存
    try {
      await this.redis.set(cacheKey, config.configValue, CONFIG_CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}`, error);
    }

    return config.configValue;
  }

  /** 批量获取配置值 (使用 mget) */
  async getByKeys(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const cacheKeys = keys.map(k => this.getCacheKey(k));

    // 1. 批量从缓存获取
    let cachedValues: (string | null)[] = [];
    try {
      cachedValues = await this.redis.mget<string>(cacheKeys);
    } catch (error) {
      this.logger.warn('Redis mget failed, falling back to DB for all keys', error);
    }

    // 2. 找出缓存未命中的 key
    const missingKeys: string[] = [];
    keys.forEach((key, index) => {
      const cached = cachedValues[index];
      if (cached !== null) {
        result[key] = cached;
      } else {
        missingKeys.push(key);
      }
    });

    // 3. 从数据库获取缺失的配置
    if (missingKeys.length > 0) {
      const filteredConfigs = await this.drizzle.db
        .select()
        .from(SysConfig)
        .where(
          and(
            withSoftDelete(SysConfig),
            inArray(SysConfig.configKey, missingKeys),
            eq(SysConfig.status, 1),
          ),
        );

      // 4. 使用 pipeline 批量写入缓存
      const cacheEntries = filteredConfigs.map(config => ({
        key: this.getCacheKey(config.configKey),
        value: config.configValue,
      }));

      if (cacheEntries.length > 0) {
        try {
          const client = this.redis.getClient();
          const pipeline = client.pipeline();
          cacheEntries.forEach(({ key, value }) => {
            pipeline.setex(key, CONFIG_CACHE_TTL, JSON.stringify(value));
          });
          await pipeline.exec();
        } catch (error) {
          this.logger.warn('Redis pipeline mset failed', error);
        }
      }

      // 5. 合并结果
      filteredConfigs.forEach(config => {
        result[config.configKey] = config.configValue;
      });
    }

    return result;
  }

  /** 创建配置 */
  async create(dto: CreateConfigDto) {
    const existing = await this.drizzle.findFirst(SysConfig, eq(SysConfig.configKey, dto.configKey));
    if (existing) {
      throw new ConflictException(`配置键 '${dto.configKey}' 已存在`);
    }

    const createdConfigs = await insertWithAudit(this.drizzle.db, SysConfig, {
      configKey: dto.configKey,
      configValue: dto.configValue,
      description: dto.description ?? '',
      status: dto.status ?? 1,
      updatedAt: new Date().toISOString(),
    });
    return Array.isArray(createdConfigs) ? createdConfigs[0] ?? null : createdConfigs;
  }

  /** 更新配置 */
  async update(id: number, dto: UpdateConfigDto) {
    const existing = await this.drizzle.findFirst(SysConfig, eq(SysConfig.id, id));
    if (!existing) {
      throw new NotFoundException(`配置 ID=${id} 不存在`);
    }

    // 如果修改了 key，检查唯一性
    if (dto.configKey && dto.configKey !== existing.configKey) {
      const keyExists = await this.drizzle.findFirst(SysConfig, eq(SysConfig.configKey, dto.configKey));
      if (keyExists) {
        throw new ConflictException(`配置键 '${dto.configKey}' 已存在`);
      }
    }

    const updatedConfigs = await updateWithAudit(this.drizzle.db, SysConfig, eq(SysConfig.id, id), {
      ...dto,
      status: dto.status !== undefined ? +dto.status : undefined,
    });
    const updated = Array.isArray(updatedConfigs) ? updatedConfigs[0] ?? null : updatedConfigs;

    // 删除缓存
    await this.clearCache(existing.configKey);
    if (dto.configKey && dto.configKey !== existing.configKey) {
      await this.clearCache(dto.configKey);
    }

    return updated;
  }

  /** 删除配置 (软删除) */
  async remove(id: number) {
    const existing = await this.drizzle.findFirst(SysConfig, eq(SysConfig.id, id));
    if (!existing) {
      throw new NotFoundException(`配置 ID=${id} 不存在`);
    }

    // 删除缓存
    await this.clearCache(existing.configKey);

    const deletedConfigs = await softDeleteWhere(this.drizzle.db, SysConfig, eq(SysConfig.id, id));
    return Array.isArray(deletedConfigs) ? deletedConfigs[0] ?? null : deletedConfigs;
  }

  /** 清除缓存 */
  private async clearCache(key: string): Promise<void> {
    try {
      await this.redis.del(this.getCacheKey(key));
    } catch (error) {
      this.logger.warn(`Redis del failed for key ${key}`, error);
    }
  }
}
