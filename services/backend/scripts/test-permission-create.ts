import { PrismaClient } from '@prisma/client';

async function testPermissionCreation() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Testing permission creation...');

    // First check current max ID
    const before = await prisma.permission.findMany({
      orderBy: { id: 'desc' },
      take: 1,
    });
    console.log('Current max ID:', before[0]?.id || 'none');

    // Test creating a new permission
    const newPerm = await prisma.permission.create({
      data: {
        permName: 'Test Permission',
        permCode: 'test:permission',
        resourceType: 'api',
        method: 'GET',
        path: '/test',
        status: 1,
      },
    });

    console.log('✅ Permission created successfully!');
    console.log('   New permission ID:', newPerm.id);
    console.log('   Perm code:', newPerm.permCode);

    // Cleanup: delete the test permission
    await prisma.permission.delete({
      where: { id: newPerm.id },
    });
    console.log('🧹 Test permission deleted');

    console.log('\n✅ Fix verified - permission creation works!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionCreation();
