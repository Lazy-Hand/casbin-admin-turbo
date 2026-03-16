/**
 * Reset Prisma sequences to sync with existing data
 *
 * This script fixes issues where PostgreSQL sequences are out of sync
 * with actual data, causing unique constraint violations on ID fields.
 *
 * Usage: npx tsx scripts/reset-sequences.ts
 */

const TABLES_TO_CHECK = [
  'sys_user',
  'sys_role',
  'sys_permission',
  'sys_file',
  'sys_timer',
  'sys_timer_execution_log',
  'sys_login_log',
  'sys_dict_type',
  'sys_dict_item',
];

async function resetSequences() {
  // Load configuration from environment
  const poolUrl = process.env.DATABASE_URL;

  if (!poolUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: poolUrl });

  try {
    console.log('🔍 Checking and resetting sequences...\n');

    let totalReset = 0;

    for (const table of TABLES_TO_CHECK) {
      const sequenceName = `${table}_id_seq`;

      // Check max ID in table
      const maxIdResult = await pool.query(
        `SELECT MAX(id) as max_id FROM ${table}`,
      );
      const maxId = Number(maxIdResult.rows[0].max_id || 0);

      // Check current sequence value
      const seqResult = await pool.query(
        `SELECT last_value FROM ${sequenceName}`,
      );
      const seqValue = Number(seqResult.rows[0].last_value || 0);

      console.log(`📊 ${table}:`);
      console.log(`   Max ID in table: ${maxId}`);
      console.log(`   Sequence value: ${seqValue}`);

      if (maxId >= seqValue) {
        const newValue = maxId + 1;
        console.log(`   ⚠️  OUT OF SYNC - resetting to ${newValue}`);

        await pool.query(
          `SELECT setval('${sequenceName}', ${newValue}, false)`,
        );

        console.log(`   ✅ Reset complete`);
        totalReset++;
      } else {
        console.log(`   ✅ In sync`);
      }

      console.log('');
    }

    console.log('─────────────────────────────────────');
    console.log(`Summary: ${totalReset} sequences reset`);
    console.log('─────────────────────────────────────');

    if (totalReset > 0) {
      console.log('\n✅ All sequences have been synchronized!');
    } else {
      console.log('\n✅ All sequences were already in sync!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetSequences();
