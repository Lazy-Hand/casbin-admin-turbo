import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';

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
    private prisma: PrismaService,
    private dataScopeService: DataScopeService,
  ) {}

  // ==================== 角色管理 ====================

  // 获取所有角色
  async findAll() {
    return this.prisma.role.findMany({
      where: {
        status: 1,
        deletedAt: null,
      },
      select: {
        id: true,
        roleName: true,
        roleCode: true,
        description: true,
        status: true,
        dataScope: true,
        customDepts: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                permName: true,
                permCode: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 分页查询角色
  async findPage(dto: PaginationDto) {
    const { pageNo = 1, pageSize = 10 } = dto;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take,
        select: {
          id: true,
          roleName: true,
          roleCode: true,
          description: true,
          status: true,
          dataScope: true,
          customDepts: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.role.count(),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }

  // 获取单个角色
  async findOne(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        roleName: true,
        roleCode: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
      },
    });
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
      const deptCount = await this.prisma.dept.count({
        where: {
          id: { in: customDepts },
          deletedAt: null,
        },
      });
      if (deptCount !== customDepts.length) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 创建角色
      const role = await tx.role.create({
        data: {
          ...roleData,
          status: roleData.status !== undefined ? +roleData.status : 1,
          dataScope:
            dataScopeNum !== undefined ? DATA_SCOPE_MAP[dataScopeNum] : 'DEPT',
          customDepts: customDepts ?? [],
        },
      });

      // 如果有权限，创建角色权限关联
      if (permissions && permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permissionId) => ({
            roleId: role.id,
            permissionId: permissionId,
          })),
        });
      }

      return role;
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
      const deptCount = await this.prisma.dept.count({
        where: {
          id: { in: customDepts },
          deletedAt: null,
        },
      });
      if (deptCount !== customDepts.length) {
        throw new BadRequestException('指定的部门不存在');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 更新角色基本信息
      const role = await tx.role.update({
        where: { id },
        data: {
          ...roleData,
          status: roleData.status !== undefined ? +roleData.status : undefined,
          ...(dataScopeNum !== undefined && {
            dataScope: DATA_SCOPE_MAP[dataScopeNum],
          }),
          ...(customDepts !== undefined && { customDepts }),
        },
      });

      // 如果传入了权限数组，更新权限关联
      if (permissions !== undefined) {
        // 先删除旧的权限关联
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // 如果有新权限，创建新的关联
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((permissionId) => ({
              roleId: id,
              permissionId: permissionId,
            })),
          });
        }
      }

      return role;
    });

    // 如果 dataScope 发生变化，清除数据范围缓存
    if (dataScopeNum !== undefined || customDepts !== undefined) {
      await this.dataScopeService.clearAllDataScopeCache();
    }

    return result;
  }

  // 删除角色
  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 先删除角色权限关联
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // 删除用户角色关联
      await tx.userRole.deleteMany({
        where: { roleId: id },
      });

      // 删除角色
      return tx.role.delete({
        where: { id },
      });
    });
  }

  // ==================== 角色-权限关联 ====================

  // 获取角色的所有权限
  async getRolePermissions(roleId: number) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
  }

  // 给角色分配单个权限
  async assignPermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  // 批量分配权限给角色
  async assignPermissions(roleId: number, permissionIds: number[]) {
    // 先删除现有权限
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 批量创建新权限
    const data = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    return this.prisma.rolePermission.createMany({
      data,
    });
  }

  // 移除角色的权限
  async removePermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  // ==================== 用户-角色关联 ====================

  // 获取用户的所有角色
  async getUserRoles(userId: number) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  // 给用户分配单个角色
  async assignRoleToUser(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  // 批量分配角色给用户
  async assignRolesToUser(userId: number, roleIds: number[]) {
    // 先删除现有角色
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // 批量创建新角色
    const data = roleIds.map((roleId) => ({
      userId,
      roleId,
    }));

    return this.prisma.userRole.createMany({
      data,
    });
  }

  // 移除用户的角色
  async removeRoleFromUser(userId: number, roleId: number) {
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }
}
