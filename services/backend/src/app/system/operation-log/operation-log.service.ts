import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'nestjs-prisma';
import {
  QueryOperationLogDto,
  CreateOperationLogDto,
  QueryLoginLogDto,
} from './dto/operation-log.dto';
import { RedisService } from '@/app/library/redis/redis.service';
import { Prisma } from '@prisma/client';

const OPERATION_LOG_QUEUE_KEY = 'operation-log:queue';
const BATCH_SIZE = 100;

@Injectable()
export class OperationLogService {
  private readonly logger = new Logger(OperationLogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 分页查询操作日志
   */
  async findPage(query: QueryOperationLogDto) {
    const {
      pageNo = 1,
      pageSize = 10,
      username,
      module,
      operation,
      startTime,
      endTime,
      status,
    } = query;

    const where: Prisma.OperationLogWhereInput = {};

    if (username) {
      where.username = { contains: username, mode: 'insensitive' };
    }

    if (module) {
      where.module = module;
    }

    if (operation) {
      where.operation = operation;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(startTime);
      }
      if (endTime) {
        where.createdAt.lte = new Date(endTime);
      }
    }

    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const [list, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }

  /**
   * 查询日志详情
   */
  async findOne(id: number) {
    return this.prisma.operationLog.findUnique({
      where: { id },
    });
  }

  /**
   * 推送日志到 Redis 队列
   */
  async pushLogQueue(log: CreateOperationLogDto): Promise<void> {
    try {
      await this.redis.lpush(OPERATION_LOG_QUEUE_KEY, JSON.stringify(log));
    } catch (error) {
      // Redis 失败不影响业务，仅记录错误
      console.error('Failed to push operation log to queue:', error);
    }
  }

  /**
   * 批量写入日志到数据库
   * 每 3 秒执行一次
   */
  @Cron('*/3 * * * * *')
  async flushLogQueue(): Promise<number> {
    try {
      // 从队列右侧取出最多 BATCH_SIZE 条记录
      const logs = await this.redis.drainList<CreateOperationLogDto>(
        OPERATION_LOG_QUEUE_KEY,
        BATCH_SIZE,
      );

      if (logs.length === 0) {
        return 0;
      }

      // 批量写入数据库
      await this.prisma.operationLog.createMany({
        data: logs,
        skipDuplicates: true,
      });

      this.logger.debug(`Flushed ${logs.length} operation logs`);
      return logs.length;
    } catch (error) {
      this.logger.error('Failed to flush operation log queue:', error);
      return 0;
    }
  }

  /**
   * 清理过期日志（6个月前）
   * 每天凌晨 2 点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanOldLogs(): Promise<number> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const result = await this.prisma.operationLog.deleteMany({
        where: {
          createdAt: {
            lt: sixMonthsAgo,
          },
        },
      });

      this.logger.log(`Cleaned ${result.count} old operation logs`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean old logs:', error);
      return 0;
    }
  }

  /**
   * 分页查询登录日志
   */
  async findLoginLogPage(query: QueryLoginLogDto) {
    const {
      pageNo = 1,
      pageSize = 10,
      username,
      status,
      startTime,
      endTime,
    } = query;

    const where: Prisma.LoginLogWhereInput = {};

    if (username) {
      where.username = { contains: username, mode: 'insensitive' };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(startTime);
      }
      if (endTime) {
        where.createdAt.lte = new Date(endTime);
      }
    }

    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const [list, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loginLog.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }
}
