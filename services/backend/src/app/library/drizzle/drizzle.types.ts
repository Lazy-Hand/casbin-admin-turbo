import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import type * as schema from './schema';

export type AppDrizzleDb = NodePgDatabase<typeof schema> & {
  $client: Pool;
};
