/**
 * 路径匹配工具
 * 处理 NestJS global prefix 的路径匹配
 */

/**
 * 匹配路径
 * @param requestPath 请求路径（可能包含 prefix）
 * @param permissionPath 权限路径（相对路径）
 * @param globalPrefix 全局 prefix（可选）
 * @returns 是否匹配
 */
export function matchPath(
  requestPath: string,
  permissionPath: string,
  globalPrefix?: string,
): boolean {
  // 如果没有 prefix，直接匹配
  if (!globalPrefix) {
    return matchPathPattern(requestPath, permissionPath);
  }

  // 移除 prefix 后匹配
  const normalizedPath = requestPath.startsWith(globalPrefix)
    ? requestPath.substring(globalPrefix.length)
    : requestPath;

  return matchPathPattern(normalizedPath, permissionPath);
}

/**
 * 匹配路径模式（支持参数）
 * @param path 实际路径
 * @param pattern 路径模式（可能包含 :id 等参数）
 * @returns 是否匹配
 */
function matchPathPattern(path: string, pattern: string): boolean {
  // 精确匹配
  if (path === pattern) {
    return true;
  }

  // 转换路径模式为正则表达式
  // /articles/:id -> /articles/[^/]+
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // 替换参数
    .replace(/\//g, '\\/'); // 转义斜杠

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}
