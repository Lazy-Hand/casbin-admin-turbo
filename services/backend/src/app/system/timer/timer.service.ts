import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CronJob } from 'cron';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { SchedulerRegistry } from '@nestjs/schedule';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreateTimerDto, UpdateTimerDto } from './dto/timer.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  DrizzleService,
  TaskTypeValue,
  Timer,
  TimerExecutionLog,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '../../library/drizzle';

const JOB_NAME_PREFIX = 'timer_';

@Injectable()
export class TimerService implements OnModuleInit {
  private readonly logger = new Logger(TimerService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.loadScheduledTimers();
  }

  /** 从数据库加载启用的定时任务并注册到调度器 */
  private async loadScheduledTimers() {
    const timers = await this.drizzle.db
      .select()
      .from(Timer)
      .where(and(withSoftDelete(Timer), eq(Timer.status, 1)));

    for (const timer of timers) {
      if (!(await this.isTaskTargetAllowed(timer.taskType, timer.target))) {
        this.logger.warn(`Skipped unsafe timer ${timer.id}: ${timer.target}`);
        continue;
      }
      this.scheduleTimer(timer);
    }

    this.logger.log(`Loaded ${timers.length} timer(s) from database`);
  }

  /** 将 cron 表达式标准化为 6 位（秒 分 时 日 月 周）*/
  private normalizeCron(cron: string): string {
    const parts = cron.trim().split(/\s+/);
    // 5 位格式 (分 时 日 月 周) -> 补 0 变为 6 位 (秒 分 时 日 月 周)
    if (parts.length === 5) {
      return ['0', ...parts].join(' ');
    }
    return cron;
  }

  /** 注册单个定时器到调度器 */
  private scheduleTimer(timer: {
    id: number;
    name: string;
    cron: string;
    taskType: string;
    target: string;
    params: unknown;
  }) {
    const jobName = `${JOB_NAME_PREFIX}${timer.id}`;

    try {
      // 若已存在则先删除
      try {
        this.schedulerRegistry.deleteCronJob(jobName);
      } catch {
        // 忽略不存在的情况
      }

      const cronExpr = this.normalizeCron(timer.cron);
      const cronJob = CronJob.from({
        cronTime: cronExpr,
        onTick: () => this.executeTimer(timer.id),
        start: true,
      });

      this.schedulerRegistry.addCronJob(jobName, cronJob);
      this.logger.debug(`Scheduled timer: ${timer.name} (id=${timer.id})`);
    } catch (err) {
      this.logger.error(
        `Failed to schedule timer ${timer.id}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** 从调度器移除定时器 */
  private unscheduleTimer(timerId: number) {
    const jobName = `${JOB_NAME_PREFIX}${timerId}`;
    try {
      const job = this.schedulerRegistry.getCronJob(jobName);
      job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
    } catch {
      // 忽略不存在的情况
    }
  }

  /** 执行定时器任务 */
  async executeTimer(timerId: number) {
    const timer = await this.drizzle.findFirst(Timer, eq(Timer.id, timerId));

    if (!timer) {
      this.logger.warn(`Timer ${timerId} not found, skip execution`);
      return;
    }

    if (!(await this.isTaskTargetAllowed(timer.taskType, timer.target))) {
      this.logger.warn(`Timer ${timerId} has unsafe target, skip execution`);
      return;
    }

    const startAt = new Date();
    let status = 1;
    let result: string | null = null;

    try {
      if (timer.taskType === 'HTTP') {
        result = await this.executeHttpTask(timer.target, timer.params);
      } else if (timer.taskType === 'SCRIPT') {
        result = await this.executeScriptTask(timer.target);
      } else {
        throw new Error(`Unknown task type: ${timer.taskType}`);
      }
    } catch (err) {
      status = 0;
      result = err instanceof Error ? err.message : String(err);
      this.logger.error(`Timer ${timerId} execution failed: ${result}`);
    } finally {
      const endAt = new Date();
      const duration = endAt.getTime() - startAt.getTime();

      await updateWithAudit(this.drizzle.db, Timer, eq(Timer.id, timerId), {
        lastRunAt: startAt.toISOString(),
      });

      await this.drizzle.db.insert(TimerExecutionLog).values({
        timerId,
        status,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        duration,
        result: result?.substring(0, 10000), // 限制长度
      });
    }
  }

  private async executeHttpTask(target: string, params?: unknown): Promise<string> {
    const options = (params as Record<string, unknown>) || {};
    const method = (options.method as string) || 'GET';
    const headers = (options.headers as Record<string, string>) || {};
    const body = options.body;

    const res = await fetch(target, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return text;
  }

  private async executeScriptTask(target: string): Promise<string> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync(target, { timeout: 60000 });
    return stderr ? `${stdout}\n${stderr}` : stdout;
  }

  // ==================== CRUD ====================

  async findAll() {
    return this.drizzle.db
      .select()
      .from(Timer)
      .where(withSoftDelete(Timer))
      .orderBy(desc(Timer.createdAt));
  }

  async findPage(dto: PaginationDto) {
    const { pageNo = 1, pageSize = 10 } = dto;
    const skip = (pageNo - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select()
        .from(Timer)
        .where(withSoftDelete(Timer))
        .orderBy(desc(Timer.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({ total: sql<number>`count(*)` })
        .from(Timer)
        .where(withSoftDelete(Timer)),
    ]);

    return { list, total: total[0]?.total ?? 0, pageNo, pageSize };
  }

  async findOne(id: number) {
    const timer = await this.drizzle.findFirst(Timer, eq(Timer.id, id));

    if (!timer) {
      throw new NotFoundException(`定时器 ${id} 不存在`);
    }

    const executionLogs = await this.drizzle.db
      .select()
      .from(TimerExecutionLog)
      .where(eq(TimerExecutionLog.timerId, id))
      .orderBy(desc(TimerExecutionLog.startAt))
      .limit(20);

    return {
      ...timer,
      executionLogs,
    };
  }

  async create(dto: CreateTimerDto) {
    await this.assertTaskTargetAllowed(dto.taskType, dto.target);

    const createdTimers = await insertWithAudit(this.drizzle.db, Timer, {
      name: dto.name,
      description: dto.description ?? null,
      cron: dto.cron,
      taskType: dto.taskType as TaskTypeValue,
      target: dto.target,
      params: dto.params ?? null,
      status: dto.status ?? 1,
      updatedAt: new Date().toISOString(),
    });
    const timer = Array.isArray(createdTimers) ? (createdTimers[0] ?? null) : createdTimers;

    if (timer?.status === 1) {
      this.scheduleTimer(timer);
    }

    return timer;
  }

  async update(id: number, dto: UpdateTimerDto) {
    const existing = await this.drizzle.findFirst(Timer, eq(Timer.id, id));

    if (!existing) {
      throw new NotFoundException(`定时器 ${id} 不存在`);
    }

    await this.assertTaskTargetAllowed(
      dto.taskType ?? existing.taskType,
      dto.target ?? existing.target,
    );

    this.unscheduleTimer(id);

    const updatedTimers = await updateWithAudit(this.drizzle.db, Timer, eq(Timer.id, id), {
      name: dto.name,
      description: dto.description,
      cron: dto.cron,
      taskType: dto.taskType as TaskTypeValue | undefined,
      target: dto.target,
      params: dto.params,
      status: dto.status,
    });
    const timer = Array.isArray(updatedTimers) ? (updatedTimers[0] ?? null) : updatedTimers;

    if (timer?.status === 1) {
      this.scheduleTimer(timer);
    }

    return timer;
  }

  async remove(id: number) {
    const existing = await this.drizzle.findFirst(Timer, eq(Timer.id, id));

    if (!existing) {
      throw new NotFoundException(`定时器 ${id} 不存在`);
    }

    this.unscheduleTimer(id);
    const deletedTimers = await softDeleteWhere(this.drizzle.db, Timer, eq(Timer.id, id));
    return Array.isArray(deletedTimers) ? (deletedTimers[0] ?? null) : deletedTimers;
  }

  /** 手动执行定时器 */
  async run(id: number) {
    const timer = await this.drizzle.findFirst(Timer, eq(Timer.id, id));

    if (!timer) {
      throw new NotFoundException(`定时器 ${id} 不存在`);
    }

    // 异步执行，不阻塞接口响应
    this.executeTimer(id);
    return { message: '执行已触发' };
  }

  /** 获取定时器执行日志 */
  async getExecutionLogs(timerId: number, limit = 50) {
    return this.drizzle.db
      .select()
      .from(TimerExecutionLog)
      .where(eq(TimerExecutionLog.timerId, timerId))
      .limit(limit)
      .orderBy(desc(TimerExecutionLog.startAt));
  }

  private async assertTaskTargetAllowed(taskType: string, target: string): Promise<void> {
    if (!(await this.isTaskTargetAllowed(taskType, target))) {
      throw new BadRequestException('任务目标不安全或暂不支持');
    }
  }

  private async isTaskTargetAllowed(taskType: string, target: string): Promise<boolean> {
    if (taskType === 'SCRIPT') {
      return false;
    }

    if (taskType !== 'HTTP') {
      return false;
    }

    try {
      const url = new URL(target);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      const hostname = url.hostname.toLowerCase();
      if (hostname === 'localhost') {
        return false;
      }

      if (this.isPrivateOrLocalAddress(hostname)) {
        return false;
      }

      const records = await lookup(hostname, { all: true, verbatim: true });
      if (records.length === 0) {
        return false;
      }

      return records.every((record) => !this.isPrivateOrLocalAddress(record.address));
    } catch {
      return false;
    }
  }

  private isPrivateOrLocalAddress(address: string): boolean {
    const normalized = address.toLowerCase();

    if (normalized === '::1') {
      return true;
    }

    const ipVersion = isIP(normalized);
    if (ipVersion === 4) {
      if (normalized.startsWith('127.')) return true;
      if (normalized.startsWith('10.')) return true;
      if (normalized.startsWith('192.168.')) return true;
      if (normalized.startsWith('169.254.')) return true;

      const match172 = normalized.match(/^172\.(\d{1,3})\./);
      if (match172) {
        const secondOctet = Number(match172[1]);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return true;
        }
      }

      return false;
    }

    if (ipVersion === 6) {
      return (
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe8') ||
        normalized.startsWith('fe9') ||
        normalized.startsWith('fea') ||
        normalized.startsWith('feb')
      );
    }

    return false;
  }
}
