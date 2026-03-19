type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonPrimitive | JsonInputValue[] | JsonObject };
type JsonInputValue = string | number | boolean | JsonInputValue[] | JsonObject;

/**
 * 敏感字段列表
 * 这些字段的值不应该被记录到日志中
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'secret',
  'apiKey',
  'secretKey',
  'privateKey',
  'creditCard',
  'ssn',
  'idCard',
  'answer',
]);

/**
 * 递归过滤对象中的敏感字段
 * @param data 原始数据
 * @returns 过滤后的数据
 */
export function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) {
      // 敏感字段替换为 ***
      result[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      result[key] = sanitizeData(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 精简参数，只保留关键字段
 * @param params 原始参数
 * @param operation 操作类型
 * @returns 精简后的参数
 */
export function simplifyParams(
  params: unknown,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
): JsonInputValue | undefined {
  if (!params || typeof params !== 'object') {
    return params as JsonInputValue | undefined;
  }

  const sanitized = sanitizeData(params) as Record<string, unknown>;

  // 对于 DELETE 操作，只保留 ID 和名称
  if (operation === 'DELETE') {
    const simplified: Record<string, unknown> = {};
    if ('id' in sanitized) simplified.id = sanitized.id;
    if (
      'username' in sanitized ||
      'roleName' in sanitized ||
      'permName' in sanitized ||
      'name' in sanitized ||
      'dictName' in sanitized
    ) {
      simplified.name =
        sanitized.username ||
        sanitized.roleName ||
        sanitized.permName ||
        sanitized.name ||
        sanitized.dictName;
    }
    return (Object.keys(simplified).length > 0 ? simplified : undefined) as
      | JsonInputValue
      | undefined;
  }

  // 对于 UPDATE 操作，只保留变更的字段
  if (operation === 'UPDATE') {
    const simplified: Record<string, unknown> = {};
    if ('id' in sanitized) simplified.id = sanitized.id;
    // 记录其他字段（已过滤敏感数据）
    for (const [key, value] of Object.entries(sanitized)) {
      if (key !== 'id') {
        simplified[key] = value;
      }
    }
    return simplified as JsonInputValue;
  }

  // CREATE 操作返回已过滤的数据
  return sanitized as JsonInputValue;
}
