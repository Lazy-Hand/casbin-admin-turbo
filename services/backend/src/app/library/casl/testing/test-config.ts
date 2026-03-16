/**
 * 测试配置
 * 提供测试环境的配置选项
 */

/**
 * 测试环境配置
 */
export const testConfig = {
  // 是否禁用权限检查（用于快速测试）
  disablePermissionCheck: process.env.TEST_DISABLE_PERMISSION_CHECK === 'true',

  // 缓存配置
  cache: {
    ttl: 60000, // 1分钟（测试环境使用较短的缓存时间）
    max: 100,
  },

  // 数据库配置
  database: {
    url:
      process.env.TEST_DATABASE_URL ||
      'postgresql://test:test@localhost:5432/test_db',
  },

  // 日志配置
  logging: {
    enabled: process.env.TEST_LOGGING_ENABLED === 'true',
    level: process.env.TEST_LOG_LEVEL || 'error',
  },
};

/**
 * 获取测试数据库 URL
 */
export function getTestDatabaseUrl(): string {
  return testConfig.database.url;
}

/**
 * 是否启用权限检查
 */
export function isPermissionCheckEnabled(): boolean {
  return !testConfig.disablePermissionCheck;
}

/**
 * 获取测试缓存配置
 */
export function getTestCacheConfig() {
  return testConfig.cache;
}
