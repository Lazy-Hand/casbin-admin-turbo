import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { PermissionInfo } from '../../library/casl/types';
import { matchPath } from '../../library/casl/utils';
import {
  DrizzleService,
  joinOnWithSoftDelete,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '../../library/drizzle';
import type { MenuTypeValue, ResourceTypeValue } from '../../library/drizzle';

/**
 * Permission Service
 * 提供权限查询、缓存管理和权限检查功能
 */
@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private globalPermissionsLoaded = false;
  private readonly cacheTtl: number;
  private readonly slowQueryThreshold: number;
  private readonly enablePreload: boolean;
  private readonly enableBatchLoad: boolean;
  private readonly globalPrefix?: string;

  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get<number>('casl.cache.ttl', 1800000);
    this.slowQueryThreshold = this.configService.get<number>(
      'casl.performance.slowQueryThreshold',
      100,
    );
    this.enablePreload = this.configService.get<boolean>('casl.performance.enablePreload', true);
    this.enableBatchLoad = this.configService.get<boolean>(
      'casl.performance.enableBatchLoad',
      true,
    );
    this.globalPrefix = this.configService.get<string>('globalPrefix');

    this.logger.log(
      `CASL 配置: cacheTtl=${this.cacheTtl}ms, slowQueryThreshold=${this.slowQueryThreshold}ms, preload=${this.enablePreload}, batchLoad=${this.enableBatchLoad}, globalPrefix=${this.globalPrefix || 'none'}`,
    );
  }

  async preloadPermissions(): Promise<void> {
    if (!this.enablePreload) {
      this.logger.log('权限预加载已禁用');
      return;
    }

    if (this.globalPermissionsLoaded) {
      return;
    }

    try {
      const startTime = Date.now();

      const permissions = await this.drizzle.db
        .select()
        .from(Permission)
        .where(and(withSoftDelete(Permission), eq(Permission.resourceType, 'api')))
        .orderBy(asc(Permission.id));

      const roles = await this.loadRolesWithPermissions();

      await this.cacheManager.set('global:permissions', permissions, 3600000);
      await this.cacheManager.set('global:roles', roles, 3600000);

      const duration = Date.now() - startTime;
      this.globalPermissionsLoaded = true;
      this.logger.log(
        `权限预加载成功: ${permissions.length} 个权限, ${roles.length} 个角色, 耗时 ${duration}ms`,
      );
      const permCodes = permissions.map((p) => p.permCode).join(', ');
      const roleCodes = roles.map((r) => r.roleCode).join(', ');
      this.logger.log(`预加载权限代码: ${permCodes}`);
      this.logger.log(`预加载角色代码: ${roleCodes}`);
    } catch (error) {
      this.logger.error('预加载权限配置失败:', error);
    }
  }

  async getUserPermissions(userId: number): Promise<PermissionInfo[]> {
    const startTime = Date.now();
    const cacheKey = `user:${userId}:permissions`;

    try {
      let permissions = await this.cacheManager.get<PermissionInfo[]>(cacheKey);

      if (!permissions) {
        permissions = await this.loadUserPermissionsFromDB(userId);
        await this.cacheManager.set(cacheKey, permissions, this.cacheTtl);
      }

      const duration = Date.now() - startTime;
      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`权限查询缓慢: ${duration}ms, userId=${userId}, cached=${!!permissions}`);
      }

      return permissions || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`权限查询失败: ${duration}ms, userId=${userId}`, error);
      throw error;
    }
  }

  private async loadUserPermissionsFromDB(userId: number): Promise<PermissionInfo[]> {
    const rows = await this.loadPermissionsForUsers([userId]);
    return this.buildPermissionMapByUser(rows).get(userId) ?? [];
  }

  async getUserMenuPermissions(userId: number): Promise<PermissionInfo[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.filter((p) => p.resourceType === 'menu');
  }

  async getUserApiPermissions(userId: number): Promise<PermissionInfo[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.filter((p) => p.resourceType === 'api');
  }

  async hasPermission(userId: number, permCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some((p) => p.permCode === permCode);
  }

  async hasRole(userId: number, roleCode: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({
        roleCode: Role.roleCode,
      })
      .from(UserRole)
      .innerJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .where(
        and(eq(UserRole.userId, userId), withSoftDelete(UserRole), eq(Role.roleCode, roleCode)),
      )
      .limit(1);

    return rows.length > 0;
  }

  async clearUserPermissionsCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}:permissions`;
    await this.cacheManager.del(cacheKey);
  }

  async clearRolePermissionsCache(roleId: number): Promise<void> {
    const userRoles = await this.drizzle.db
      .select({
        userId: UserRole.userId,
      })
      .from(UserRole)
      .where(eq(UserRole.roleId, roleId));

    for (const ur of userRoles) {
      await this.clearUserPermissionsCache(ur.userId);
    }
  }

  async getUserPermissionsBatch(userIds: number[]): Promise<Map<number, PermissionInfo[]>> {
    if (!this.enableBatchLoad) {
      this.logger.warn('批量加载已禁用，使用单个查询');
      const result = new Map<number, PermissionInfo[]>();
      for (const userId of userIds) {
        const permissions = await this.getUserPermissions(userId);
        result.set(userId, permissions);
      }
      return result;
    }

    const startTime = Date.now();
    const result = new Map<number, PermissionInfo[]>();

    try {
      const uncachedUserIds: number[] = [];
      for (const userId of userIds) {
        const cacheKey = `user:${userId}:permissions`;
        const cached = await this.cacheManager.get<PermissionInfo[]>(cacheKey);
        if (cached) {
          result.set(userId, cached);
        } else {
          uncachedUserIds.push(userId);
        }
      }

      if (uncachedUserIds.length === 0) {
        const duration = Date.now() - startTime;
        this.logger.debug(
          `批量加载完成（全部缓存命中）: ${userIds.length} 个用户, 耗时 ${duration}ms`,
        );
        return result;
      }

      const rows = await this.loadPermissionsForUsers(uncachedUserIds);
      const permissionMapByUser = this.buildPermissionMapByUser(rows);

      for (const userId of uncachedUserIds) {
        const permissions = permissionMapByUser.get(userId) ?? [];
        result.set(userId, permissions);
        await this.cacheManager.set(`user:${userId}:permissions`, permissions, this.cacheTtl);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `批量加载完成: ${userIds.length} 个用户 (${uncachedUserIds.length} 个从数据库加载), 耗时 ${duration}ms`,
      );

      if (duration > this.slowQueryThreshold * 2) {
        this.logger.warn(`批量加载缓慢: ${duration}ms, userIds=${userIds.length}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`批量加载失败: ${duration}ms, userIds=${userIds.length}`, error);
      throw error;
    }
  }

  async hasPathPermission(userId: number, method: string, path: string): Promise<boolean> {
    const permissions = await this.getUserApiPermissions(userId);

    return permissions.some((p) => {
      if (p.method && p.method !== method) {
        return false;
      }

      return matchPath(path, p.path, this.globalPrefix);
    });
  }

  async getAllPermissions() {
    return this.drizzle.db
      .select()
      .from(Permission)
      .where(withSoftDelete(Permission))
      .orderBy(asc(Permission.resourceType), asc(Permission.permCode));
  }

  async getPermissionById(id: number) {
    const permissions = await this.drizzle.db
      .select()
      .from(Permission)
      .where(withSoftDelete(Permission, eq(Permission.id, id)))
      .limit(1);

    return permissions[0] ?? null;
  }

  async getMenuPermissions(query: { permName?: string; status?: number }) {
    const permissions = await this.drizzle.db
      .select()
      .from(Permission)
      .where(
        and(
          withSoftDelete(Permission),
          eq(Permission.resourceType, 'menu'),
          query.permName ? ilike(Permission.permName, `%${query.permName}%`) : undefined,
          query.status !== undefined ? eq(Permission.status, query.status) : undefined,
        ),
      )
      .orderBy(asc(Permission.sort), asc(Permission.id));

    return this.buildMenuTree(permissions);
  }

  async getMenuAndButtonPermissions(query: { permName?: string; status?: number }) {
    const { permName, status } = query;
    const statusCondition = status !== undefined ? eq(Permission.status, status) : undefined;

    if (!permName) {
      const permissions = await this.drizzle.db
        .select()
        .from(Permission)
        .where(
          and(
            withSoftDelete(Permission),
            statusCondition,
            inArray(Permission.resourceType, ['menu', 'button']),
          ),
        )
        .orderBy(asc(Permission.sort), asc(Permission.id));

      return this.buildMenuTree(permissions);
    }

    const [matchedMenus, matchedButtons] = await Promise.all([
      this.drizzle.db
        .select({
          id: Permission.id,
        })
        .from(Permission)
        .where(
          and(
            withSoftDelete(Permission),
            statusCondition,
            eq(Permission.resourceType, 'menu'),
            ilike(Permission.permName, `%${permName}%`),
          ),
        ),
      this.drizzle.db
        .select({
          id: Permission.id,
          parentId: Permission.parentId,
        })
        .from(Permission)
        .where(
          and(
            withSoftDelete(Permission),
            statusCondition,
            eq(Permission.resourceType, 'button'),
            ilike(Permission.permName, `%${permName}%`),
          ),
        ),
    ]);

    const matchedMenuIds = new Set<number>(matchedMenus.map((item) => item.id));
    const matchedButtonIds = matchedButtons.map((item) => item.id);
    for (const button of matchedButtons) {
      if (button.parentId) {
        matchedMenuIds.add(button.parentId);
      }
    }

    const menuIds = Array.from(matchedMenuIds);
    if (menuIds.length === 0 && matchedButtonIds.length === 0) {
      return [];
    }

    const permissions = await this.drizzle.db
      .select()
      .from(Permission)
      .where(
        and(
          withSoftDelete(Permission),
          statusCondition,
          or(
            and(
              eq(Permission.resourceType, 'menu'),
              inArray(Permission.id, menuIds.length > 0 ? menuIds : [-1]),
            ),
            and(
              eq(Permission.resourceType, 'button'),
              inArray(Permission.id, matchedButtonIds.length > 0 ? matchedButtonIds : [-1]),
            ),
            and(
              eq(Permission.resourceType, 'button'),
              inArray(
                Permission.parentId,
                matchedMenus.length > 0 ? matchedMenus.map((item) => item.id) : [-1],
              ),
            ),
          ),
        ),
      )
      .orderBy(asc(Permission.sort), asc(Permission.id));

    return this.buildMenuTree(permissions);
  }

  async getButtonPermissionsPage(query: {
    pageNo?: number;
    pageSize?: number;
    permName?: string;
    permCode?: string;
    parentId: number;
  }) {
    const { pageNo = 1, pageSize = 10, permName, permCode, parentId } = query;
    const skip = (pageNo - 1) * pageSize;

    const where = and(
      withSoftDelete(Permission),
      eq(Permission.resourceType, 'button'),
      eq(Permission.parentId, parentId),
      permName ? ilike(Permission.permName, `%${permName}%`) : undefined,
      permCode ? ilike(Permission.permCode, `%${permCode}%`) : undefined,
    );

    const [list, totalRows] = await Promise.all([
      this.drizzle.db
        .select()
        .from(Permission)
        .where(where)
        .orderBy(asc(Permission.sort), asc(Permission.id))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(Permission)
        .where(where),
    ]);

    return {
      list,
      total: totalRows[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }

  private buildMenuTree(permissions: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const perm of permissions) {
      map.set(perm.id, { ...perm, children: [] });
    }

    for (const perm of permissions) {
      const node = map.get(perm.id);
      if (!node) continue;

      if (perm.parentId === null || perm.parentId === 0) {
        roots.push(node);
      } else {
        const parent = map.get(perm.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    const removeEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        const result = { ...node };
        if (result.children && result.children.length === 0) {
          delete result.children;
        } else if (result.children) {
          result.children = removeEmptyChildren(result.children);
        }
        return result;
      });
    };

    return removeEmptyChildren(roots);
  }

  async createPermission(data: {
    permName: string;
    permCode: string;
    method?: string;
    resourceType: ResourceTypeValue;
    menuType?: MenuTypeValue;
    path?: string;
    component?: string;
    icon?: string;
    sort?: number;
    cache?: number;
    hidden?: number;
    frameUrl?: string;
    status?: number;
    parentId?: number;
  }) {
    const createdPermissions = await insertWithAudit(this.drizzle.db, Permission, {
      permName: data.permName,
      permCode: data.permCode,
      method: data.method || '',
      resourceType: data.resourceType,
      menuType: data.menuType || null,
      path: data.path || '',
      component: data.component || '',
      icon: data.icon || '',
      sort: data.sort ?? 0,
      cache: data.cache ?? 0,
      hidden: data.hidden ?? 0,
      frameUrl: data.frameUrl || '',
      status: data.status ?? 1,
      parentId: data.parentId && data.parentId !== 0 ? data.parentId : null,
      updatedAt: new Date().toISOString(),
    });
    const permission = Array.isArray(createdPermissions)
      ? createdPermissions[0]
      : createdPermissions;

    await this.cacheManager.del('global:permissions');

    return permission ?? null;
  }

  async updatePermission(
    permissionId: number,
    data: {
      permName?: string;
      permCode?: string;
      method?: string;
      resourceType?: ResourceTypeValue;
      menuType?: MenuTypeValue;
      path?: string;
      component?: string;
      icon?: string;
      sort?: number;
      cache?: number;
      hidden?: number;
      frameUrl?: string;
      status?: number;
      parentId?: number;
    },
  ) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId && data.parentId > 0 ? data.parentId : null;
    }

    const updatedPermissions = await updateWithAudit(
      this.drizzle.db,
      Permission,
      eq(Permission.id, permissionId),
      updateData as any,
    );
    const permission = Array.isArray(updatedPermissions)
      ? updatedPermissions[0]
      : updatedPermissions;

    await this.cacheManager.del('global:permissions');

    const rolePermissions = await this.drizzle.db
      .select({
        roleId: RolePermission.roleId,
      })
      .from(RolePermission)
      .where(eq(RolePermission.permissionId, permissionId));

    for (const rp of rolePermissions) {
      await this.clearRolePermissionsCache(rp.roleId);
    }

    return permission ?? null;
  }

  async deletePermission(permissionId: number) {
    const rolePermissions = await this.drizzle.db
      .select({
        roleId: RolePermission.roleId,
      })
      .from(RolePermission)
      .where(eq(RolePermission.permissionId, permissionId));

    const deletedPermissions = await softDeleteWhere(
      this.drizzle.db,
      Permission,
      eq(Permission.id, permissionId),
    );
    const permission = Array.isArray(deletedPermissions)
      ? deletedPermissions[0]
      : deletedPermissions;

    await this.cacheManager.del('global:permissions');

    for (const rp of rolePermissions) {
      await this.clearRolePermissionsCache(rp.roleId);
    }

    return permission ?? null;
  }

  private async loadPermissionsForUsers(userIds: number[]) {
    if (userIds.length === 0) {
      return [];
    }

    return this.drizzle.db
      .select({
        userId: User.id,
        permission: {
          id: Permission.id,
          permCode: Permission.permCode,
          permName: Permission.permName,
          resourceType: Permission.resourceType,
          method: Permission.method,
          path: Permission.path,
          menuType: Permission.menuType,
        },
      })
      .from(User)
      .innerJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(User.id, UserRole.userId)))
      .innerJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .innerJoin(
        RolePermission,
        joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)),
      )
      .innerJoin(
        Permission,
        joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)),
      )
      .where(and(withSoftDelete(User), inArray(User.id, userIds)));
  }

  private buildPermissionMapByUser(
    rows: Array<{
      userId: number;
      permission: {
        id: number;
        permCode: string;
        permName: string;
        resourceType: ResourceTypeValue | null;
        method: string;
        path: string;
        menuType: MenuTypeValue | null;
      };
    }>,
  ) {
    const result = new Map<number, PermissionInfo[]>();
    const dedupe = new Map<number, Map<number, PermissionInfo>>();

    for (const row of rows) {
      if (!row.permission.resourceType) {
        continue;
      }

      const permissionMap = dedupe.get(row.userId) ?? new Map<number, PermissionInfo>();
      if (!permissionMap.has(row.permission.id)) {
        permissionMap.set(row.permission.id, {
          id: row.permission.id,
          permCode: row.permission.permCode,
          permName: row.permission.permName,
          resourceType: row.permission.resourceType,
          method: row.permission.method,
          path: row.permission.path,
          menuType: row.permission.menuType || undefined,
        });
      }

      dedupe.set(row.userId, permissionMap);
    }

    for (const [userId, permissionMap] of dedupe.entries()) {
      result.set(userId, Array.from(permissionMap.values()));
    }

    return result;
  }

  private async loadRolesWithPermissions() {
    const rows = await this.drizzle.db
      .select({
        id: Role.id,
        roleCode: Role.roleCode,
        roleName: Role.roleName,
        permission: {
          id: Permission.id,
          permCode: Permission.permCode,
          permName: Permission.permName,
          resourceType: Permission.resourceType,
          method: Permission.method,
          path: Permission.path,
          menuType: Permission.menuType,
        },
      })
      .from(Role)
      .leftJoin(
        RolePermission,
        joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)),
      )
      .leftJoin(
        Permission,
        joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)),
      )
      .where(withSoftDelete(Role));

    const roles = new Map<number, any>();

    for (const row of rows) {
      const current = roles.get(row.id) ?? {
        id: row.id,
        roleCode: row.roleCode,
        roleName: row.roleName,
        permissions: [],
      };

      if (
        row.permission?.id &&
        row.permission.resourceType &&
        !current.permissions.some((item: PermissionInfo) => item.id === row.permission!.id)
      ) {
        current.permissions.push({
          id: row.permission.id,
          permCode: row.permission.permCode,
          permName: row.permission.permName,
          resourceType: row.permission.resourceType,
          method: row.permission.method,
          path: row.permission.path,
          menuType: row.permission.menuType || undefined,
        });
      }

      roles.set(row.id, current);
    }

    return [...roles.values()];
  }
}
