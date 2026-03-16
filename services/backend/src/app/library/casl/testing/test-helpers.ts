import { createMongoAbility } from '@casl/ability';
import type {
  AppAbility,
  UserWithPermissions,
  PermissionInfo,
  RoleWithPermissions,
} from '../types';

/**
 * 测试辅助工具
 * 提供创建测试数据和模拟对象的方法
 */

/**
 * 创建测试用户
 * @param overrides 覆盖默认值
 * @returns 测试用户对象
 */
export function createTestUser(
  overrides?: Partial<UserWithPermissions>,
): UserWithPermissions {
  return {
    id: 1,
    username: 'testuser',
    roles: [],
    ...overrides,
  };
}

/**
 * 创建测试角色
 * @param overrides 覆盖默认值
 * @returns 测试角色对象
 */
export function createTestRole(
  overrides?: Partial<RoleWithPermissions>,
): RoleWithPermissions {
  return {
    id: 1,
    roleName: '测试角色',
    roleCode: 'test_role',
    permissions: [],
    ...overrides,
  };
}

/**
 * 创建测试权限
 * @param overrides 覆盖默认值
 * @returns 测试权限对象
 */
export function createTestPermission(
  overrides?: Partial<PermissionInfo>,
): PermissionInfo {
  return {
    id: 1,
    permCode: 'article:read',
    permName: '读取文章',
    resourceType: 'api',
    method: 'GET',
    path: '/api/articles',
    ...overrides,
  };
}

/**
 * 创建具有特定权限的测试用户
 * @param permissions 权限列表
 * @returns 测试用户对象
 */
export function createUserWithPermissions(
  permissions: PermissionInfo[],
): UserWithPermissions {
  return {
    id: 1,
    username: 'testuser',
    roles: [
      {
        id: 1,
        roleName: '测试角色',
        roleCode: 'test_role',
        permissions,
      },
    ],
  };
}

/**
 * 创建管理员测试用户
 * @returns 管理员用户对象
 */
export function createAdminUser(): UserWithPermissions {
  return {
    id: 1,
    username: 'admin',
    roles: [
      {
        id: 1,
        roleName: '管理员',
        roleCode: 'admin',
        permissions: [],
      },
    ],
  };
}

/**
 * 创建模拟 Ability 实例
 * @param rules 权限规则
 * @returns Ability 实例
 */
export function createMockAbility(
  rules: Array<{ action: string; subject: string; conditions?: any }>,
): AppAbility {
  const ability = createMongoAbility();

  for (const rule of rules) {
    if (rule.conditions) {
      ability.can(rule.action, rule.subject, rule.conditions);
    } else {
      ability.can(rule.action, rule.subject);
    }
  }

  return ability as AppAbility;
}

/**
 * 创建具有所有权限的 Ability 实例
 * @returns Ability 实例
 */
export function createAdminAbility(): AppAbility {
  const ability = createMongoAbility();
  ability.can('manage', 'all');
  return ability as AppAbility;
}

/**
 * 创建测试请求对象
 * @param user 用户对象
 * @param params 路径参数
 * @param query 查询参数
 * @param body 请求体
 * @returns 模拟请求对象
 */
export function createMockRequest(
  user?: any,
  params?: any,
  query?: any,
  body?: any,
) {
  return {
    user: user || { id: 1, username: 'testuser' },
    params: params || {},
    query: query || {},
    body: body || {},
  };
}

/**
 * 创建测试执行上下文
 * @param request 请求对象
 * @returns 模拟执行上下文
 */
export function createMockExecutionContext(request: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
