# 数据库维护脚本

本目录包含数据库性能测试和维护脚本。

## 📁 脚本列表

### 1. performance-test.ts
**用途**: 数据库性能测试

测试内容：
- 单个用户权限查询性能
- 批量用户权限查询性能
- 权限代码查询性能
- 角色代码查询性能

**运行**:
```bash
npm run test:performance
```

**预期结果**:
- 单用户查询: < 100ms
- 批量查询: < 5ms/用户
- 权限查询: < 50ms
- 角色查询: < 50ms

---

### 2. check-indexes.sql
**用途**: 检查数据库索引是否正确创建

**运行**:
```bash
npm run db:check-indexes
```

**预期结果**: 应该看到 9 个索引
- sys_user_username_idx
- sys_role_roleCode_idx
- sys_permission_permCode_idx
- sys_permission_resourceType_idx
- sys_permission_method_path_idx
- sys_user_role_userId_idx
- sys_user_role_roleId_idx
- sys_role_permission_roleId_idx
- sys_role_permission_permissionId_idx

---

### 3. db-maintenance.sql
**用途**: 数据库定期维护

执行操作：
- 更新表统计信息（ANALYZE）
- 清理死元组（VACUUM）
- 查看表统计
- 查看索引使用情况
- 查看表大小

**运行**:
```bash
npm run db:maintenance
```

**建议频率**: 每周一次或数据量大幅变化后

---

### 4. enable-slow-query-log.sql
**用途**: 启用慢查询日志（开发/调试用）

配置：
- 慢查询阈值: 100ms
- 记录所有 SQL 语句
- 记录查询执行时间

**运行**:
```bash
npm run db:enable-slow-log
```

**注意**: 仅在开发环境使用，生产环境会产生大量日志

---

## 🚀 快速使用

### 首次设置
```bash
# 1. 应用数据库迁移（包含索引）
npx prisma migrate deploy

# 2. 验证索引
npm run db:check-indexes

# 3. 运行性能测试
npm run test:performance
```

### 定期维护
```bash
# 每周运行一次
npm run db:maintenance

# 或单独运行
npm run db:analyze   # 更新统计信息
npm run db:vacuum    # 清理死元组
```

### 性能调优
```bash
# 1. 启用慢查询日志
npm run db:enable-slow-log

# 2. 运行应用，观察日志

# 3. 运行性能测试
npm run test:performance

# 4. 根据结果优化
```

---

## 📊 性能基准

### 测试环境
- PostgreSQL 14+
- 1000 用户
- 10 角色
- 100 权限

### 基准数据

| 操作 | 无索引 | 有索引 | 提升 |
|------|--------|--------|------|
| 单用户查询 | ~150ms | ~50ms | 66% |
| 批量查询（100用户） | ~5000ms | ~200ms | 96% |
| 权限代码查询 | ~80ms | ~20ms | 75% |
| 角色代码查询 | ~60ms | ~15ms | 75% |

---

## 🔧 故障排除

### 问题1: 性能测试失败
**原因**: 数据库中没有测试数据

**解决**:
```bash
# 运行 seed 脚本
npx prisma db seed
```

### 问题2: 索引检查显示缺少索引
**原因**: 迁移未应用

**解决**:
```bash
# 应用迁移
npx prisma migrate deploy
```

### 问题3: psql 命令不可用
**原因**: PostgreSQL 客户端未安装

**解决**:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# 或使用 Docker
docker exec -i postgres_container psql -U user -d dbname < script.sql
```

---

## 📚 相关文档

- [DATABASE_GUIDE.md](../docs/database/DATABASE_GUIDE.md) - 数据库优化完整指南
- [OPTIMIZATION_STATUS.md](../docs/database/OPTIMIZATION_STATUS.md) - 优化实施状态
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 💡 最佳实践

1. **定期维护**: 每周运行 `db:maintenance`
2. **性能监控**: 定期运行 `test:performance` 验证性能
3. **索引验证**: 部署后运行 `db:check-indexes`
4. **慢查询分析**: 开发时启用慢查询日志
5. **数据备份**: 维护前备份数据库

---

## 🎯 下一步

1. 运行性能测试建立基准
2. 设置定期维护计划
3. 监控慢查询日志
4. 根据实际情况调整优化策略
