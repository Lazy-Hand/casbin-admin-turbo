-- 检查数据库索引
-- 验证所有推荐的索引是否已创建

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sys_user', 'sys_role', 'sys_permission', 'sys_user_role', 'sys_role_permission')
ORDER BY tablename, indexname;

-- 预期结果应该包含以下索引：
-- sys_user_username_idx
-- sys_role_roleCode_idx
-- sys_permission_permCode_idx
-- sys_permission_resourceType_idx
-- sys_permission_method_path_idx
-- sys_user_role_userId_idx
-- sys_user_role_roleId_idx
-- sys_role_permission_roleId_idx
-- sys_role_permission_permissionId_idx
