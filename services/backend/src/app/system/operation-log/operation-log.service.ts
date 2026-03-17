import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, desc, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import {
  QueryOperationLogDto,
  CreateOperationLogDto,
  QueryLoginLogDto,
} from './dto/operation-log.dto';
import { RedisService } from '@/app/library/redis/redis.service';
import { DrizzleService, LoginLog, OperationLog } from '@/app/library/drizzle';

const OPERATION_LOG_QUEUE_KEY = 'operation-log:queue';
const BATCH_SIZE = 100;

@Injectable()
export class OperationLogService {
  private readonly logger = new Logger(OperationLogService.name);

  constructor(
    private readonly drizzle: DrizzleService,
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

    const where = and(
      username ? ilike(OperationLog.username, `%${username}%`) : undefined,
      module ? eq(OperationLog.module, module) : undefined,
      operation ? eq(OperationLog.operation, operation) : undefined,
      status !== undefined ? eq(OperationLog.status, status) : undefined,
      startTime ? gte(OperationLog.createdAt, new Date(startTime).toISOString()) : undefined,
      endTime ? lte(OperationLog.createdAt, new Date(endTime).toISOString()) : undefined,
    );

    const skip = (pageNo - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select()
        .from(OperationLog)
        .where(where)
        .orderBy(desc(OperationLog.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({ total: sql<number>`count(*)` })
        .from(OperationLog)
        .where(where),
    ]);

    return {
      list,
      total: total[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }

  /**
   * 查询日志详情
   */
  async findOne(id: number) {
    return this.drizzle.findFirst(OperationLog, eq(OperationLog.id, id));
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

      await this.drizzle.db.insert(OperationLog).values(logs as any);

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

      const result = await this.drizzle.db
        .delete(OperationLog)
        .where(lte(OperationLog.createdAt, sixMonthsAgo.toISOString()))
        .returning({ id: OperationLog.id });

      this.logger.log(`Cleaned ${result.length} old operation logs`);
      return result.length;
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

    const where = and(
      username ? ilike(LoginLog.username, `%${username}%`) : undefined,
      status !== undefined ? eq(LoginLog.status, status) : undefined,
      startTime ? gte(LoginLog.createdAt, new Date(startTime).toISOString()) : undefined,
      endTime ? lte(LoginLog.createdAt, new Date(endTime).toISOString()) : undefined,
    );

    const skip = (pageNo - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select()
        .from(LoginLog)
        .where(where)
        .orderBy(desc(LoginLog.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({ total: sql<number>`count(*)` })
        .from(LoginLog)
        .where(where),
    ]);

    return {
      list,
      total: total[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }
}
