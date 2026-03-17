import { Injectable, BadRequestException } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import {
  Dept,
  DrizzleService,
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  insertWithAudit,
  joinOnWithSoftDelete,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '@/app/library/drizzle';

// DataScope 枚举类型
type DataScopeEnum = 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD';

/**
 * 数据范围映射
 * 1: ALL - 全部数据
 * 2: CUSTOM - 自定义部门
 * 3: DEPT - 本部门
 * 4: DEPT_AND_CHILD - 本部门及以下
 */
const DATA_SCOPE_MAP: Record<number, DataScopeEnum> = {
  1: 'ALL',
  2: 'CUSTOM',
  3: 'DEPT',
  4: 'DEPT_AND_CHILD',
};

const REVERSE_DATA_SCOPE_MAP: Record<DataScopeEnum, number> = {
  ALL: 1,
  CUSTOM: 2,
  DEPT: 3,
  DEPT_AND_CHILD: 4,
};

@Injectable()
export class RoleService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  // ==================== 角色管理 ====================

  // 获取所有角色
  async findAll() {
    const [rows, userCounts] = await Promise.all([
      this.drizzle.db
        .select({
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
          description: Role.description,
          status: Role.status,
          dataScope: Role.dataScope,
          customDepts: Role.customDepts,
          createdAt: Role.createdAt,
          updatedAt: Role.updatedAt,
          permission: {
            id: Permission.id,
            permName: Permission.permName,
            permCode: Permission.permCode,
          },
        })
        .from(Role)
        .leftJoin(RolePermission, joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)))
        .leftJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
        .where(and(withSoftDelete(Role), eq(Role.status, 1)))
        .orderBy(desc(Role.createdAt)),
      this.drizzle.db
        .select({
          roleId: UserRole.roleId,
          count: sql<number>`count(*)`,
        })
        .from(UserRole)
        .where(withSoftDelete(UserRole))
        .groupBy(UserRole.roleId),
    ]);

    return this.groupRoles(rows, userCounts);
  }

  // 分页查询角色
  async findPage(dto: PaginationDto) {
    const { pageNo = 1, pageSize = 10 } = dto;
    const skip = (pageNo - 1) * pageSize;

    const [roles, totalRows, userCounts] = await Promise.all([
      this.drizzle.db
        .select({
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
          description: Role.description,
          status: Role.status,
          dataScope: Role.dataScope,
          customDepts: Role.customDepts,
          createdAt: Role.createdAt,
          updatedAt: Role.updatedAt,
        })
        .from(Role)
        .where(withSoftDelete(Role))
        .orderBy(desc(Role.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(Role)
        .where(withSoftDelete(Role)),
      this.drizzle.db
        .select({
          roleId: UserRole.roleId,
          count: sql<number>`count(*)`,
        })
        .from(UserRole)
        .groupBy(UserRole.roleId),
    ]);

    const countMap = new Map(userCounts.map((item) => [item.roleId, item.count]));
    const list = roles.map((role) => ({
      ...role,
      _count: {
        users: countMap.get(role.id) ?? 0,
      },
    }));

    return {
      list,
      total: totalRows[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }

  // 获取单个角色
  async findOne(id: number) {
    const rows = await this.drizzle.db
      .select({
        id: Role.id,
        roleName: Role.roleName,
        roleCode: Role.roleCode,
        description: Role.description,
        status: Role.status,
        dataScope: Role.dataScope,
        customDepts: Role.customDepts,
        createdAt: Role.createdAt,
        updatedAt: Role.updatedAt,
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          component: Permission.component,
          resourceType: Permission.resourceType,
          menuType: Permission.menuType,
          path: Permission.path,
          icon: Permission.icon,
          sort: Permission.sort,
          cache: Permission.cache,
          hidden: Permission.hidden,
          frameUrl: Permission.frameUrl,
          status: Permission.status,
          parentId: Permission.parentId,
          createdAt: Permission.createdAt,
          updatedAt: Permission.updatedAt,
        },
        user: {
          id: User.id,
          username: User.username,
          nickname: User.nickname,
        },
      })
      .from(Role)
      .leftJoin(RolePermission, joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)))
      .leftJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
      .leftJoin(UserRole, joinOnWithSoftDelete(UserRole, eq(Role.id, UserRole.roleId)))
      .leftJoin(User, joinOnWithSoftDelete(User, eq(UserRole.userId, User.id)))
      .where(withSoftDelete(Role, eq(Role.id, id)));

    if (rows.length === 0) {
      return null;
    }

    return this.groupRoleDetail(rows);
  }

  // 创建角色
  async create(dto: CreateRoleDto) {
    const {
      permissions,
      dataScope: dataScopeNum,
      customDepts,
      ...roleData
    } = dto;

    // 验证：当 dataScope = 2 (CUSTOM) 时，customDepts 必须指定
    if (dataScopeNum === 2 && (!customDepts || customDepts.length === 0)) {
      throw new BadRequestException('自定义数据范围必须指定部门');
    }

    // 验证自定义部门是否存在
    if (customDepts && customDepts.length > 0) {
      const deptCount = await this.countExistingDepts(customDepts);
      if (deptCount !== new Set(customDepts).size) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    const result = await this.drizzle.db.transaction(async (tx: any) => {
      const createdRoles = await insertWithAudit(tx, Role, {
        ...roleData,
        description: roleData.description ?? '',
        status: roleData.status !== undefined ? +roleData.status : 1,
        dataScope:
          dataScopeNum !== undefined ? DATA_SCOPE_MAP[dataScopeNum] : 'DEPT',
        customDepts: customDepts ?? [],
        updatedAt: new Date().toISOString(),
      });
      const role = Array.isArray(createdRoles) ? createdRoles[0] : createdRoles;

      if (role && permissions && permissions.length > 0) {
        await tx.insert(RolePermission).values(
          permissions.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        );
      }

      return role ?? null;
    });

    return result;
  }

  // 更新角色
  async update(id: number, dto: UpdateRoleDto) {
    const {
      permissions,
      dataScope: dataScopeNum,
      customDepts,
      ...roleData
    } = dto;

    // 验证：当 dataScope = 2 (CUSTOM) 时，customDepts 必须指定
    if (dataScopeNum === 2 && (!customDepts || customDepts.length === 0)) {
      throw new BadRequestException('自定义数据范围必须指定部门');
    }

    // 验证自定义部门是否存在
    if (customDepts && customDepts.length > 0) {
      const deptCount = await this.countExistingDepts(customDepts);
      if (deptCount !== new Set(customDepts).size) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    const result = await this.drizzle.db.transaction(async (tx: any) => {
      const updatedRoles = await updateWithAudit(tx, Role, eq(Role.id, id), {
          ...roleData,
          status: roleData.status !== undefined ? +roleData.status : undefined,
          ...(dataScopeNum !== undefined && {
            dataScope: DATA_SCOPE_MAP[dataScopeNum],
          }),
          ...(customDepts !== undefined && { customDepts }),
      });
      const role = Array.isArray(updatedRoles) ? updatedRoles[0] : updatedRoles;

      if (permissions !== undefined) {
        await tx.delete(RolePermission).where(eq(RolePermission.roleId, id));

        if (permissions.length > 0) {
          await tx.insert(RolePermission).values(
            permissions.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          );
        }
      }

      return role ?? null;
    });

    // 如果 dataScope 发生变化，清除数据范围缓存
    if (dataScopeNum !== undefined || customDepts !== undefined) {
      await this.dataScopeService.clearAllDataScopeCache();
    }

    return result;
  }

  // 删除角色
  async remove(id: number) {
    return this.drizzle.db.transaction(async (tx: any) => {
      await tx.delete(RolePermission).where(eq(RolePermission.roleId, id));
      await tx.delete(UserRole).where(eq(UserRole.roleId, id));
      const deletedRoles = await softDeleteWhere(tx, Role, eq(Role.id, id));
      return Array.isArray(deletedRoles) ? deletedRoles[0] ?? null : null;
    });
  }

  // ==================== 角色-权限关联 ====================

  // 获取角色的所有权限
  async getRolePermissions(roleId: number) {
    return this.drizzle.db
      .select({
        roleId: RolePermission.roleId,
        permissionId: RolePermission.permissionId,
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          component: Permission.component,
          resourceType: Permission.resourceType,
          menuType: Permission.menuType,
          path: Permission.path,
          icon: Permission.icon,
          sort: Permission.sort,
          cache: Permission.cache,
          hidden: Permission.hidden,
          frameUrl: Permission.frameUrl,
          status: Permission.status,
          parentId: Permission.parentId,
          createdAt: Permission.createdAt,
          updatedAt: Permission.updatedAt,
        },
      })
      .from(RolePermission)
      .innerJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
      .where(and(eq(RolePermission.roleId, roleId), withSoftDelete(RolePermission)));
  }

  // 给角色分配单个权限
  async assignPermission(roleId: number, permissionId: number) {
    return this.drizzle.db
      .insert(RolePermission)
      .values({
        roleId,
        permissionId,
      })
      .returning();
  }

  // 批量分配权限给角色
  async assignPermissions(roleId: number, permissionIds: number[]) {
    await this.drizzle.db.delete(RolePermission).where(eq(RolePermission.roleId, roleId));

    const data = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    if (data.length === 0) {
      return { count: 0 };
    }

    const result = await this.drizzle.db.insert(RolePermission).values(data).returning();
    return { count: result.length };
  }

  // 移除角色的权限
  async removePermission(roleId: number, permissionId: number) {
    const result = await this.drizzle.db
      .delete(RolePermission)
      .where(
        and(
          eq(RolePermission.roleId, roleId),
          eq(RolePermission.permissionId, permissionId),
        ),
      )
      .returning();

    return result[0] ?? null;
  }

  // ==================== 用户-角色关联 ====================

  // 获取用户的所有角色
  async getUserRoles(userId: number) {
    const rows = await this.drizzle.db
      .select({
        userId: UserRole.userId,
        roleId: UserRole.roleId,
        role: {
          id: Role.id,
          roleName: Role.roleName,
          roleCode: Role.roleCode,
          description: Role.description,
          status: Role.status,
          dataScope: Role.dataScope,
          customDepts: Role.customDepts,
          createdAt: Role.createdAt,
          updatedAt: Role.updatedAt,
        },
        permission: {
          id: Permission.id,
          permName: Permission.permName,
          permCode: Permission.permCode,
          method: Permission.method,
          component: Permission.component,
          resourceType: Permission.resourceType,
          menuType: Permission.menuType,
          path: Permission.path,
          icon: Permission.icon,
          sort: Permission.sort,
          cache: Permission.cache,
          hidden: Permission.hidden,
          frameUrl: Permission.frameUrl,
          status: Permission.status,
          parentId: Permission.parentId,
          createdAt: Permission.createdAt,
          updatedAt: Permission.updatedAt,
        },
      })
      .from(UserRole)
      .innerJoin(Role, joinOnWithSoftDelete(Role, eq(UserRole.roleId, Role.id)))
      .leftJoin(RolePermission, joinOnWithSoftDelete(RolePermission, eq(Role.id, RolePermission.roleId)))
      .leftJoin(Permission, joinOnWithSoftDelete(Permission, eq(RolePermission.permissionId, Permission.id)))
      .where(and(eq(UserRole.userId, userId), withSoftDelete(UserRole)));

    return this.groupUserRoles(rows);
  }

  // 给用户分配单个角色
  async assignRoleToUser(userId: number, roleId: number) {
    return this.drizzle.db
      .insert(UserRole)
      .values({
        userId,
        roleId,
      })
      .returning();
  }

  // 批量分配角色给用户
  async assignRolesToUser(userId: number, roleIds: number[]) {
    await this.drizzle.db.delete(UserRole).where(eq(UserRole.userId, userId));

    const data = roleIds.map((roleId) => ({
      userId,
      roleId,
    }));

    if (data.length === 0) {
      return { count: 0 };
    }

    const result = await this.drizzle.db.insert(UserRole).values(data).returning();
    return { count: result.length };
  }

  // 移除用户的角色
  async removeRoleFromUser(userId: number, roleId: number) {
    const result = await this.drizzle.db
      .delete(UserRole)
      .where(and(eq(UserRole.userId, userId), eq(UserRole.roleId, roleId)))
      .returning();

    return result[0] ?? null;
  }

  private async countExistingDepts(deptIds: number[]) {
    const uniqueDeptIds = [...new Set(deptIds)];
    const result = await this.drizzle.db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(Dept)
      .where(and(withSoftDelete(Dept), inArray(Dept.id, uniqueDeptIds)));

    return result[0]?.total ?? 0;
  }

  private groupRoles(
    rows: Array<{
      id: number;
      roleName: string;
      roleCode: string;
      description: string | null;
      status: number;
      dataScope: DataScopeEnum;
      customDepts: number[] | null;
      createdAt: string;
      updatedAt: string;
      permission: {
        id: number | null;
        permName: string | null;
        permCode: string | null;
      } | null;
    }>,
    userCounts: Array<{ roleId: number; count: number }>,
  ) {
    const countMap = new Map(userCounts.map((item) => [item.roleId, item.count]));
    const roles = new Map<number, any>();

    for (const row of rows) {
      const current =
        roles.get(row.id) ??
        {
          id: row.id,
          roleName: row.roleName,
          roleCode: row.roleCode,
          description: row.description,
          status: row.status,
          dataScope: row.dataScope,
          customDepts: row.customDepts,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          permissions: [],
          _count: {
            users: countMap.get(row.id) ?? 0,
          },
        };

      if (row.permission?.id) {
        current.permissions.push({
          permission: row.permission,
        });
      }

      roles.set(row.id, current);
    }

    return [...roles.values()];
  }

  private groupRoleDetail(rows: any[]) {
    const first = rows[0];
    const permissions = new Map<number, any>();
    const users = new Map<number, any>();

    for (const row of rows) {
      if (row.permission?.id && !permissions.has(row.permission.id)) {
        permissions.set(row.permission.id, {
          permission: row.permission,
        });
      }

      if (row.user?.id && !users.has(row.user.id)) {
        users.set(row.user.id, {
          user: row.user,
        });
      }
    }

    return {
      id: first.id,
      roleName: first.roleName,
      roleCode: first.roleCode,
      description: first.description,
      status: first.status,
      dataScope: first.dataScope,
      customDepts: first.customDepts,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
      permissions: [...permissions.values()],
      users: [...users.values()],
    };
  }

  private groupUserRoles(rows: any[]) {
    const roles = new Map<number, any>();

    for (const row of rows) {
      if (!row.role?.id) {
        continue;
      }

      const current =
        roles.get(row.role.id) ??
        {
          roleId: row.roleId,
          userId: row.userId,
          role: {
            ...row.role,
            permissions: [],
          },
        };

      if (
        row.permission?.id &&
        !current.role.permissions.some((item: any) => item.permission.id === row.permission.id)
      ) {
        current.role.permissions.push({
          permission: row.permission,
        });
      }

      roles.set(row.role.id, current);
    }

    return [...roles.values()];
  }
}
