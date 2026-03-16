import { z } from 'zod';

export const AppConfigSchema = z.object({
  port: z.number().int().positive(),
  nodeEnv: z.string().min(1),
  globalPrefix: z.string().min(1).default('/api'),
  upload: z.object({
    dir: z.string().min(1),
    chunkDir: z.string().min(1),
    prefix: z.string().min(1),
    maxFileSize: z.number().int().positive(),
    maxFiles: z.number().int().positive(),
    chunkSize: z.number().int().positive(),
  }),
  redis: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    password: z.string().optional(),
    db: z.number().int().nonnegative(),
    keyPrefix: z.string().min(1),
    enablePubSub: z.boolean(),
  }),
  jwt: z.object({
    secret: z.string().min(1),
    expiresIn: z.number().int().positive(),
    sessionTtl: z.number().int().positive(),
    sessionRefreshThreshold: z.number().int().positive(),
  }),
  casl: z.object({
    cache: z.object({
      ttl: z.number().int().positive(),
      max: z.number().int().positive(),
    }),
    logging: z.object({
      level: z.string().min(1),
      logPermissions: z.boolean(),
    }),
    performance: z.object({
      enablePreload: z.boolean(),
      enableBatchLoad: z.boolean(),
      slowQueryThreshold: z.number().int().positive(),
    }),
  }),
  logging: z.object({
    level: z.string().min(1),
    enableConsole: z.boolean(),
    enableFile: z.boolean(),
    logDir: z.string().min(1),
    maxFileSize: z.string().min(1),
    maxFiles: z.string().min(1),
    datePattern: z.string().min(1),
    enablePrismaLogging: z.boolean(),
    prismaLogLevels: z.array(z.string().min(1)).min(1),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
