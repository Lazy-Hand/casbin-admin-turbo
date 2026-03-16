import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { getLoggerConfig } from '../logger/logger.config';
import { DRIZZLE_DB } from './drizzle.constants';
import { WinstonDrizzleLogger } from './drizzle.logger';
import { DrizzleService } from './drizzle.service';
import * as schema from './schema';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_DB,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });

        const config = getLoggerConfig(configService);

        return drizzle(pool, {
          schema,
          logger: config.enablePrismaLogging
            ? new WinstonDrizzleLogger(logger)
            : false,
        });
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
    DrizzleService,
  ],
  exports: [DRIZZLE_DB, DrizzleService],
})
export class DrizzleModule {}
