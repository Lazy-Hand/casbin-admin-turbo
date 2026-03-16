/**
 * API 路径到模块的映射
 */
const MODULE_PATH_MAP: Record<string, string> = {
  '/api/users': 'user',
  '/api/roles': 'role',
  '/api/permissions': 'permission',
  '/api/timers': 'timer',
  '/api/files': 'file',
  '/api/dict-types': 'dict',
  '/api/dict-items': 'dict',
  '/api/posts': 'post',
};

/**
 * 根据 API 路径识别模块
 * @param path API 路径
 * @returns 模块名，如果无法识别则返回 'unknown'
 */
export function identifyModule(path: string): string {
  // 移除查询参数
  const cleanPath = path.split('?')[0];

  // 尝试精确匹配
  for (const [prefix, module] of Object.entries(MODULE_PATH_MAP)) {
    if (cleanPath.startsWith(prefix)) {
      return module;
    }
  }

  return 'unknown';
}

/**
 * 获取模块的中文名称
 * @param module 模块标识
 * @returns 中文名称
 */
export function getModuleName(module: string): string {
  const moduleNameMap: Record<string, string> = {
    user: '用户',
    role: '角色',
    permission: '权限',
    timer: '定时任务',
    file: '文件',
    dict: '字典',
    post: '岗位',
  };

  return moduleNameMap[module] || module;
}
