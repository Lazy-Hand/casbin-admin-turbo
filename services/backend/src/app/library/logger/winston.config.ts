import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getLoggerConfig, LoggerConfig } from './logger.config';

export function createWinstonConfig(
  configService: ConfigService,
): WinstonModuleOptions {
  const config = getLoggerConfig(configService);
  const transports: winston.transport[] = [];

  // 添加控制台传输器
  if (config.enableConsole) {
    transports.push(createConsoleTransport());
  }

  // 添加文件传输器
  if (config.enableFile) {
    transports.push(
      createFileTransport(config, 'combined'),
      createFileTransport(config, 'error', 'error'),
    );

    // 添加 Prisma 查询日志专用传输器
    if (config.enablePrismaLogging) {
      transports.push(createPrismaQueryTransport(config));
    }
  }

  return {
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json({
        replacer: (key, value) => {
          // 处理 BigInt
          if (typeof value === 'bigint') {
            return value.toString();
          }
          // 处理 Error 对象
          if (value instanceof Error) {
            return {
              message: value.message,
              stack: value.stack,
              name: value.name,
            };
          }
          return value;
        },
      }),
    ),
    transports,
  };
}

function createConsoleTransport(): winston.transport {
  return new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonModuleUtilities.format.nestLike('NestApp', {
        colors: true,
        prettyPrint: true,
        processId: true,
        appName: true,
      }),
    ),
  });
}

function createFileTransport(
  config: LoggerConfig,
  filename: string,
  level?: string,
): winston.transport {
  const transport = new DailyRotateFile({
    filename: `${config.logDir}/${filename}-%DATE%.log`,
    datePattern: config.datePattern,
    maxSize: config.maxFileSize,
    maxFiles: config.maxFiles,
    level: level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  });

  // 添加错误处理
  transport.on('error', (error) => {
    console.error('Logger file transport error:', error.message);
  });

  return transport;
}

function createPrismaQueryTransport(config: LoggerConfig): winston.transport {
  const transport = new DailyRotateFile({
    filename: `${config.logDir}/prisma-query-%DATE%.log`,
    datePattern: config.datePattern,
    maxSize: config.maxFileSize,
    maxFiles: config.maxFiles,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format((info) => {
        // 只记录来自 PrismaService 的日志
        if (info.context === 'PrismaService') {
          return info;
        }
        return false;
      })(),
      winston.format.json(),
    ),
  });

  // 添加错误处理
  transport.on('error', (error) => {
    console.error('Logger Prisma transport error:', error.message);
  });

  return transport;
}
