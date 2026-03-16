import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RedisService } from '@/app/library/redis/redis.service';
import { BaseRepository, DataScopeConfig } from '@/common/repositories/base.repository';

/**
 * Redis 缓存键前缀
 */
const DATA_SCOPE_CACHE_PREFIX = 'data_scope:';
const DATA_SCOPE_CACHE_TTL = 1800; // 30 分钟

/**
 * 数据范围配置（从数据库读取的原始值）
 */
interface DbDataScopeConfig {
  scope: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD';
  deptId: number | null;
  customDepts: number[];
}

/**
 * 数据范围服务
 * 负责计算用户数据范围配置和构建 Prisma where 条件
 */
@Injectable()
export class DataScopeService extends BaseRepository {
  private readonly logger = new Logger(DataScopeService.name);

  constructor(
    protected readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super(prisma, null as any); // 基类需要 dataScopeService，但这个服务本身就是
  }

  /**
   * 获取用户数据范围配置（带缓存）
   * @param userId 用户ID
   * @param resourceType 资源类型
   * @returns 数据范围配置
   */
  async getUserDataScope(
    userId: number,
    resourceType: string,
  ): Promise<DataScopeConfig> {
    // 尝试从缓存获取
    const cacheKey = `${DATA_SCOPE_CACHE_PREFIX}${userId}:${resourceType}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached as DataScopeConfig;
    }

    // 从数据库获取
    const config = await this.fetchDataScopeFromDb(userId);

    // 缓存结果
    await this.redis.set(cacheKey, config, DATA_SCOPE_CACHE_TTL);

    return config;
  }

  /**
   * 从数据库获取数据范围配置
   */
  private async fetchDataScopeFromDb(userId: number): Promise<DataScopeConfig> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isAdmin: true,
        deptId: true,
        roles: {
          select: {
            role: {
              select: {
                dataScope: true,
                customDepts: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        scope: 'DEPT',
        deptId: null,
      };
    }

    // 管理员拥有全部数据权限
    if (user.isAdmin) {
      return {
        scope: 'ALL',
        deptId: user.deptId,
      };
    }

    // 获取用户角色的数据范围（取最高权限）
    let dataScope: DbDataScopeConfig['scope'] = 'DEPT';
    let customDepts: number[] = [];

    // 定义权限优先级（数字越大权限越高）
    const scopePriority: Record<string, number> = {
      'DEPT': 1,
      'CUSTOM': 2,
      'DEPT_AND_CHILD': 3,
      'ALL': 4,
    };

    for (const userRole of user.roles) {
      const role = userRole.role;
      const roleScope = role.dataScope;
      const currentPriority = scopePriority[dataScope];
      const rolePriority = scopePriority[roleScope];

      // 如果角色权限更高，更新
      if (rolePriority > currentPriority) {
        dataScope = roleScope as DbDataScopeConfig['scope'];
        if (roleScope === 'DEPT_AND_CHILD' || roleScope === 'CUSTOM') {
          customDepts = (role.customDepts as number[]) || [];
        }
      }
    }

    return {
      scope: dataScope,
      deptId: user.deptId,
      customDepts,
    };
  }

  /**
   * 构建 Prisma where 条件
   * @param config 数据范围配置
   * @returns Prisma where 条件
   */
  async buildWhereClause(
    config: DataScopeConfig,
  ): Promise<Record<string, any>> {
    const { scope, deptId, customDepts } = config;

    switch (scope) {
      case 'ALL':
        // 全部数据权限，不添加过滤条件
        return {};

      case 'DEPT':
        // 本部门数据
        if (!deptId) {
          // 用户没有部门，只能看到自己的数据
          return { id: -1 }; // 返回空结果
        }
        return { deptId };

      case 'DEPT_AND_CHILD':
        // 本部门及以下数据
        if (!deptId) {
          return { id: -1 };
        }
        return {
          deptId: { in: await this.getDescendantDeptIds(deptId) },
        };

      case 'CUSTOM':
        // 自定义部门数据
        if (!customDepts || customDepts.length === 0) {
          return { id: -1 };
        }
        return { deptId: { in: customDepts } };

      default:
        return {};
    }
  }

  /**
   * 获取部门所有后代 ID（异步版本）
   * @param deptId 部门ID
   * @returns 所有后代部门ID（包含自己）
   */
  async getDescendantDeptIds(deptId: number): Promise<number[]> {
    // 查询 ancestors 字段包含该部门 ID 的所有部门
    const depts = await this.prisma.dept.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: deptId },
          { ancestors: { contains: `,${deptId}` } },
          { ancestors: { equals: `0,${deptId}` } },
        ],
      },
      select: { id: true },
    });

    return depts.map((d) => d.id);
  }

  /**
   * 清除用户的数据范围缓存
   * @param userId 用户ID
   */
  async clearUserDataScopeCache(userId: number): Promise<void> {
    const pattern = `${DATA_SCOPE_CACHE_PREFIX}${userId}:*`;
    await this.redis.delByPattern(pattern);
  }

  /**
   * 清除所有数据范围缓存
   */
  async clearAllDataScopeCache(): Promise<void> {
    const pattern = `${DATA_SCOPE_CACHE_PREFIX}*`;
    await this.redis.delByPattern(pattern);
  }
}
