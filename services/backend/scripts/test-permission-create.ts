import { Pool } from 'pg';
import 'dotenv/config';

async function testPermissionCreation() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧪 Testing permission creation...');

    // First check current max ID
    const before = await pool.query(
      'select id from sys_permission order by id desc limit 1',
    );
    console.log('Current max ID:', before.rows[0]?.id || 'none');

    // Test creating a new permission
    const insertResult = await pool.query(
      `
        insert into sys_permission (
          perm_name,
          perm_code,
          resource_type,
          method,
          path,
          status,
          created_at,
          updated_at
        ) values ($1, $2, $3, $4, $5, $6, now(), now())
        returning id, perm_code
      `,
      ['Test Permission', 'test:permission', 'api', 'GET', '/test', 1],
    );
    const newPerm = insertResult.rows[0];

    console.log('✅ Permission created successfully!');
    console.log('   New permission ID:', newPerm.id);
    console.log('   Perm code:', newPerm.perm_code);

    // Cleanup: delete the test permission
    await pool.query('delete from sys_permission where id = $1', [newPerm.id]);
    console.log('🧹 Test permission deleted');

    console.log('\n✅ Fix verified - permission creation works!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testPermissionCreation();
