-- 数据库维护脚本
-- 定期运行此脚本以保持数据库性能

-- ==================== 更新表统计信息 ====================
ANALYZE sys_user;
ANALYZE sys_role;
ANALYZE sys_permission;
ANALYZE sys_user_role;
ANALYZE sys_role_permission;

-- ==================== 清理死元组 ====================
VACUUM ANALYZE sys_user;
VACUUM ANALYZE sys_role;
VACUUM ANALYZE sys_permission;
VACUUM ANALYZE sys_user_role;
VACUUM ANALYZE sys_role_permission;

-- ==================== 查看表统计 ====================
SELECT 
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename LIKE 'sys_%'
ORDER BY tablename;

-- ==================== 查看索引使用情况 ====================
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'sys_%'
ORDER BY idx_scan DESC;

-- ==================== 查看表大小 ====================
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'sys_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
