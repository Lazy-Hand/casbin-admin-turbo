import 'dotenv/config';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');
const MIGRATIONS_TABLE = 'schema_migrations';
const LEGACY_MIGRATIONS_TABLE = '_prisma_migrations';

type MigrationRecord = {
  name: string;
  checksum: string;
  applied_at: Date;
};

function checksum(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

async function listMigrationFolders() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readMigrationSql(name: string) {
  const filePath = path.join(MIGRATIONS_DIR, name, 'migration.sql');
  return fs.readFile(filePath, 'utf8');
}

async function ensureMigrationsTable(pool: Pool) {
  await pool.query(`
    create table if not exists ${MIGRATIONS_TABLE} (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
}

async function hasLegacyPrismaMigrations(pool: Pool) {
  const result = await pool.query<{ exists: string | null }>(`
    select to_regclass('${LEGACY_MIGRATIONS_TABLE}') as exists
  `);
  return Boolean(result.rows[0]?.exists);
}

async function bootstrapLegacyHistory(pool: Pool) {
  const current = await pool.query<{ count: string }>(
    `select count(*) from ${MIGRATIONS_TABLE}`,
  );

  if (Number(current.rows[0]?.count ?? 0) > 0) {
    return;
  }

  if (!(await hasLegacyPrismaMigrations(pool))) {
    return;
  }

  const legacy = await pool.query<{ migration_name: string; finished_at: Date | null }>(`
    select migration_name, finished_at
    from ${LEGACY_MIGRATIONS_TABLE}
    where finished_at is not null
    order by finished_at asc
  `);

  for (const row of legacy.rows) {
    const sql = await readMigrationSql(row.migration_name).catch(() => null);
    if (!sql) {
      continue;
    }

    await pool.query(
      `
        insert into ${MIGRATIONS_TABLE} (name, checksum, applied_at)
        values ($1, $2, $3)
        on conflict (name) do nothing
      `,
      [row.migration_name, checksum(sql), row.finished_at ?? new Date()],
    );
  }
}

async function getAppliedMigrations(pool: Pool) {
  const result = await pool.query<MigrationRecord>(
    `select name, checksum, applied_at from ${MIGRATIONS_TABLE} order by applied_at asc`,
  );

  return new Map<string, MigrationRecord>(
    result.rows.map((row) => [row.name, row]),
  );
}

async function applyMigrations(pool: Pool) {
  const migrationNames = await listMigrationFolders();
  const applied = await getAppliedMigrations(pool);

  for (const name of migrationNames) {
    const sql = await readMigrationSql(name);
    const currentChecksum = checksum(sql);
    const existing = applied.get(name);

    if (existing) {
      if (existing.checksum !== currentChecksum) {
        throw new Error(`Migration ${name} checksum mismatch. Refusing to continue.`);
      }
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query(
        `
          insert into ${MIGRATIONS_TABLE} (name, checksum)
          values ($1, $2)
        `,
        [name, currentChecksum],
      );
      await client.query('commit');
      console.log(`Applied migration: ${name}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('Database migrations are up to date.');
}

async function showStatus(pool: Pool) {
  const migrationNames = await listMigrationFolders();
  const applied = await getAppliedMigrations(pool);

  for (const name of migrationNames) {
    const status = applied.has(name) ? 'applied' : 'pending';
    console.log(`${status.padEnd(8)} ${name}`);
  }
}

async function main() {
  const command = process.argv[2] ?? 'up';

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await ensureMigrationsTable(pool);
    await bootstrapLegacyHistory(pool);

    if (command === 'status') {
      await showStatus(pool);
      return;
    }

    if (command === 'up') {
      await applyMigrations(pool);
      return;
    }

    throw new Error(`Unsupported command: ${command}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
