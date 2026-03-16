-- 启用慢查询日志
-- 用于开发和调试环境

-- 设置慢查询阈值为 100ms
ALTER SYSTEM SET log_min_duration_statement = 100;

-- 记录所有 SQL 语句
ALTER SYSTEM SET log_statement = 'all';

-- 记录查询执行时间
ALTER SYSTEM SET log_duration = on;

-- 重新加载配置
SELECT pg_reload_conf();

-- 查看当前配置
SHOW log_min_duration_statement;
SHOW log_statement;
SHOW log_duration;
