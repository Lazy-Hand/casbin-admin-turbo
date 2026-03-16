import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/app/library/redis/redis.service';
import { CreateConfigDto, UpdateConfigDto, ConfigQueryDto } from './dto/config.dto';
import type { Prisma } from '@prisma/client';

const CONFIG_CACHE_PREFIX = 'config:';
const CONFIG_CACHE_TTL = 86400; // 24 hours

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** 获取缓存键 */
  private getCacheKey(key: string): string {
    return `${CONFIG_CACHE_PREFIX}${key}`;
  }

  /** 分页查询配置 */
  async findPage(dto: ConfigQueryDto) {
    const { pageNo = 1, pageSize = 10, configKey, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.SysConfigWhereInput = {
      deletedAt: null,
    };
    if (configKey) {
      where.configKey = { contains: configKey, mode: 'insensitive' };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await Promise.all([
      this.prisma.sysConfig.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysConfig.count({ where }),
    ]);

    return { list, total, pageNo, pageSize };
  }

  /** 获取所有启用的配置 (不缓存) */
  async findAll() {
    return this.prisma.sysConfig.findMany({
      where: { status: 1, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 根据 ID 获取配置详情 */
  async findOne(id: number) {
    const config = await this.prisma.sysConfig.findUnique({
      where: { id, deletedAt: null },
    });
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
    const config = await this.prisma.sysConfig.findFirst({
      where: { configKey: key, status: 1, deletedAt: null },
    });

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
      const configs = await this.prisma.sysConfig.findMany({
        where: {
          configKey: { in: missingKeys },
          status: 1,
          deletedAt: null,
        },
      });

      // 4. 使用 pipeline 批量写入缓存
      const cacheEntries = configs.map(config => ({
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
      configs.forEach(config => {
        result[config.configKey] = config.configValue;
      });
    }

    return result;
  }

  /** 创建配置 */
  async create(dto: CreateConfigDto) {
    // 检查 key 唯一性
    const existing = await this.prisma.sysConfig.findUnique({
      where: { configKey: dto.configKey },
    });
    if (existing) {
      throw new ConflictException(`配置键 '${dto.configKey}' 已存在`);
    }

    return this.prisma.sysConfig.create({
      data: {
        configKey: dto.configKey,
        configValue: dto.configValue,
        description: dto.description ?? '',
        status: dto.status ?? 1,
      },
    });
  }

  /** 更新配置 */
  async update(id: number, dto: UpdateConfigDto) {
    const existing = await this.prisma.sysConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`配置 ID=${id} 不存在`);
    }

    // 如果修改了 key，检查唯一性
    if (dto.configKey && dto.configKey !== existing.configKey) {
      const keyExists = await this.prisma.sysConfig.findUnique({
        where: { configKey: dto.configKey },
      });
      if (keyExists) {
        throw new ConflictException(`配置键 '${dto.configKey}' 已存在`);
      }
    }

    const updated = await this.prisma.sysConfig.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status !== undefined ? +dto.status : undefined,
      },
    });

    // 删除缓存
    await this.clearCache(existing.configKey);
    if (dto.configKey && dto.configKey !== existing.configKey) {
      await this.clearCache(dto.configKey);
    }

    return updated;
  }

  /** 删除配置 (软删除) */
  async remove(id: number) {
    const existing = await this.prisma.sysConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`配置 ID=${id} 不存在`);
    }

    // 删除缓存
    await this.clearCache(existing.configKey);

    return this.prisma.sysConfig.delete({ where: { id } });
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
