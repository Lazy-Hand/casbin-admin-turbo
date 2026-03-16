import { MongoAbility } from '@casl/ability';

/**
 * CASL Action 类型
 * 定义系统中所有可能的操作类型
 */
export type Action =
  | 'manage' // 所有操作的特殊标识
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'publish'
  | string; // 支持自定义操作

/**
 * CASL Subject 类型
 * 定义系统中所有可能的资源主体
 */
export type Subject =
  | 'all' // 所有资源的特殊标识
  | 'User'
  | 'Role'
  | 'Permission'
  | 'Article'
  | 'Comment'
  | string; // 支持自定义主体

/**
 * AppAbility 类型
 * 定义应用的权限能力类型
 */
export type AppAbility = MongoAbility<[Action, Subject]>;

/**
 * 用户完整信息类型
 * 包含用户基本信息、角色和权限
 */
export interface UserWithPermissions {
  id: number;
  username: string;
  roles: RoleWithPermissions[];
}

/**
 * 角色完整信息类型
 * 包含角色基本信息和关联的权限
 */
export interface RoleWithPermissions {
  id: number;
  roleCode: string;
  roleName: string;
  permissions: PermissionInfo[];
}

/**
 * 权限信息类型
 * 包含权限的所有必要字段
 */
export interface PermissionInfo {
  id: number;
  permCode: string;
  permName: string;
  resourceType: 'api' | 'menu' | 'button';
  method: string;
  path: string;
  menuType?: string;
}
