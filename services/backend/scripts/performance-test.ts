#!/usr/bin/env tsx
/**
 * 数据库性能测试脚本
 * 用于验证优化效果
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testQueryPerformance() {
  console.log('🚀 开始数据库性能测试...\n');

  try {
    // 测试1: 单个用户权限查询
    console.log('📊 测试1: 单个用户权限查询');
    const userId = 1;
    const iterations = 1000;

    const start1 = Date.now();
    for (let i = 0; i < iterations; i++) {
      await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });
    }
    const duration1 = Date.now() - start1;
    console.log(`  ✅ 完成 ${iterations} 次查询`);
    console.log(`  ⏱️  总耗时: ${duration1}ms`);
    console.log(`  📈 平均: ${(duration1 / iterations).toFixed(2)}ms`);
    console.log(
      `  🎯 目标: < 100ms (${duration1 / iterations < 100 ? '✅ 达标' : '❌ 未达标'})\n`,
    );

    // 测试2: 批量查询
    console.log('📊 测试2: 批量用户权限查询');
    const userIds = Array.from({ length: 100 }, (_, i) => i + 1);

    const start2 = Date.now();
    await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    const duration2 = Date.now() - start2;
    console.log(`  ✅ 完成 ${userIds.length} 个用户查询`);
    console.log(`  ⏱️  总耗时: ${duration2}ms`);
    console.log(`  📈 平均: ${(duration2 / userIds.length).toFixed(2)}ms/用户`);
    console.log(
      `  🎯 目标: < 500ms (${duration2 < 500 ? '✅ 达标' : '❌ 未达标'})\n`,
    );

    // 测试3: 权限代码查询
    console.log('📊 测试3: 权限代码查询');
    const permIterations = 1000;

    const start3 = Date.now();
    for (let i = 0; i < permIterations; i++) {
      await prisma.permission.findFirst({
        where: { permCode: 'article:read' },
      });
    }
    const duration3 = Date.now() - start3;
    console.log(`  ✅ 完成 ${permIterations} 次查询`);
    console.log(`  ⏱️  总耗时: ${duration3}ms`);
    console.log(`  📈 平均: ${(duration3 / permIterations).toFixed(2)}ms`);
    console.log(
      `  🎯 目标: < 50ms (${duration3 / permIterations < 50 ? '✅ 达标' : '❌ 未达标'})\n`,
    );

    // 测试4: 角色代码查询
    console.log('📊 测试4: 角色代码查询');
    const roleIterations = 1000;

    const start4 = Date.now();
    for (let i = 0; i < roleIterations; i++) {
      await prisma.role.findFirst({
        where: { roleCode: 'admin' },
      });
    }
    const duration4 = Date.now() - start4;
    console.log(`  ✅ 完成 ${roleIterations} 次查询`);
    console.log(`  ⏱️  总耗时: ${duration4}ms`);
    console.log(`  📈 平均: ${(duration4 / roleIterations).toFixed(2)}ms`);
    console.log(
      `  🎯 目标: < 50ms (${duration4 / roleIterations < 50 ? '✅ 达标' : '❌ 未达标'})\n`,
    );

    // 总结
    console.log('📋 性能测试总结:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `  单用户查询: ${(duration1 / iterations).toFixed(2)}ms (目标: <100ms)`,
    );
    console.log(
      `  批量查询: ${(duration2 / userIds.length).toFixed(2)}ms/用户 (目标: <5ms)`,
    );
    console.log(
      `  权限查询: ${(duration3 / permIterations).toFixed(2)}ms (目标: <50ms)`,
    );
    console.log(
      `  角色查询: ${(duration4 / roleIterations).toFixed(2)}ms (目标: <50ms)`,
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 性能测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testQueryPerformance().catch((error) => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
