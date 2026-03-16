import type { Logger as DrizzleLogger } from 'drizzle-orm/logger';
import type { Logger } from 'winston';

export class WinstonDrizzleLogger implements DrizzleLogger {
  constructor(private readonly logger: Logger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.info('Drizzle Query', {
      context: 'DrizzleService',
      query,
      params,
    });
  }
}
