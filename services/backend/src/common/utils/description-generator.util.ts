import type { LogOperationValue } from '@/app/library/drizzle';
import { getModuleName } from './module-mapper.util';

/**
 * 名称字段映射
 * 用于从响应数据中提取实体名称
 */
const NAME_FIELD_MAP: Record<string, string> = {
  user: 'username',
  role: 'roleName',
  permission: 'permName',
  timer: 'name',
  dict: 'dictName',
  post: 'postName',
};

/**
 * 操作类型中文映射
 */
const OPERATION_TEXT_MAP: Record<LogOperationValue, string> = {
  CREATE: '创建',
  UPDATE: '修改',
  DELETE: '删除',
};

/**
 * 从响应数据中提取实体名称
 * @param module 模块名
 * @param responseData 响应数据
 * @returns 实体名称
 */
function extractEntityName(module: string, responseData: unknown): string | undefined {
  if (!responseData || typeof responseData !== 'object') {
    return undefined;
  }

  const nameField = NAME_FIELD_MAP[module];
  if (!nameField) {
    return undefined;
  }

  const data = responseData as Record<string, unknown>;
  return data[nameField] as string | undefined;
}

/**
 * 生成操作描述
 * @param module 模块名
 * @param operation 操作类型
 * @param responseData 响应数据
 * @returns 操作描述
 */
export function generateDescription(
  module: string,
  operation: LogOperationValue,
  responseData: unknown,
): string {
  const moduleName = getModuleName(module);
  const operationText = OPERATION_TEXT_MAP[operation];
  const entityName = extractEntityName(module, responseData);

  if (entityName) {
    return `${operationText}${moduleName} ${entityName}`;
  }

  return `${operationText}${moduleName}`;
}
