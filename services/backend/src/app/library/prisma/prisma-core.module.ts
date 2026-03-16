import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomPrismaModule } from 'nestjs-prisma';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { getLoggerConfig } from '../logger/logger.config';
import { createAuditExtension } from './prisma-audit.extension';

/** CustomPrismaModule 的服务名，用于注入 */
export const APP_PRISMA = 'AppPrisma';

function setupPrismaLogging(baseClient: any, logger: Logger) {
  if (typeof baseClient.$on !== 'function') return;
  baseClient.$on('query', (e: any) => {
    logger.info('Prisma Query', {
      context: 'PrismaService',
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e.target,
    });
  });
  baseClient.$on('info', (e: any) => {
    logger.info(e.message, { context: 'PrismaService', target: e.target });
  });
  baseClient.$on('warn', (e: any) => {
    logger.warn(e.message, { context: 'PrismaService', target: e.target });
  });
  baseClient.$on('error', (e: any) => {
    logger.error(e.message, { context: 'PrismaService', target: e.target });
  });
}

/**
 * 使用 CustomPrismaModule 提供带审计扩展和 Winston 日志的 Prisma Client
 */
@Module({
  imports: [
    ConfigModule,
    CustomPrismaModule.forRootAsync({
      isGlobal: false,
      name: APP_PRISMA,
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
        logger: Logger,
      ): Promise<PrismaClient> => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        const adapter = new PrismaPg(pool);
        const config = getLoggerConfig(configService);
        const base = new PrismaClient({
          adapter,
          log: config.enablePrismaLogging
            ? config.prismaLogLevels.map((level) => ({
                emit: 'event',
                level: level as 'query' | 'info' | 'warn' | 'error',
              }))
            : [],
        });
        if (config.enablePrismaLogging) {
          setupPrismaLogging(base, logger);
        }
        const extended = base.$extends(
          createAuditExtension(base),
        ) as unknown as PrismaClient;
        await extended.$connect();
        return extended;
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    }),
  ],
  exports: [CustomPrismaModule],
})
export class PrismaCoreModule {}
