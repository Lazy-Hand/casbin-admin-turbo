import { ConfigService } from '@nestjs/config';

export interface LoggerConfig {
  level: string; // 日志级别
  enableConsole: boolean; // 是否启用控制台输出
  enableFile: boolean; // 是否启用文件输出
  logDir: string; // 日志目录路径
  maxFileSize: string; // 单个文件最大大小
  maxFiles: string; // 保留的最大文件数
  datePattern: string; // 日期模式（用于轮转）
  enablePrismaLogging: boolean; // 是否启用数据库日志（Prisma / Drizzle）
  prismaLogLevels: string[]; // Prisma 日志级别数组
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'log',
  enableConsole: true,
  enableFile: true,
  logDir: 'logs',
  maxFileSize: '20m',
  maxFiles: '14d',
  datePattern: 'YYYY-MM-DD',
  enablePrismaLogging: false,
  prismaLogLevels: ['query', 'info', 'warn', 'error'],
};

export function getLoggerConfig(configService: ConfigService): LoggerConfig {
  return {
    level: configService.get('logging.level', DEFAULT_LOGGER_CONFIG.level),
    enableConsole: configService.get(
      'logging.enableConsole',
      DEFAULT_LOGGER_CONFIG.enableConsole,
    ),
    enableFile: configService.get(
      'logging.enableFile',
      DEFAULT_LOGGER_CONFIG.enableFile,
    ),
    logDir: configService.get('logging.logDir', DEFAULT_LOGGER_CONFIG.logDir),
    maxFileSize: configService.get(
      'logging.maxFileSize',
      DEFAULT_LOGGER_CONFIG.maxFileSize,
    ),
    maxFiles: configService.get(
      'logging.maxFiles',
      DEFAULT_LOGGER_CONFIG.maxFiles,
    ),
    datePattern: configService.get(
      'logging.datePattern',
      DEFAULT_LOGGER_CONFIG.datePattern,
    ),
    enablePrismaLogging: configService.get(
      'logging.enablePrismaLogging',
      DEFAULT_LOGGER_CONFIG.enablePrismaLogging,
    ),
    prismaLogLevels: configService.get(
      'logging.prismaLogLevels',
      DEFAULT_LOGGER_CONFIG.prismaLogLevels,
    ),
  };
}
