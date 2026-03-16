import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import { BaseRepository } from '@/common/repositories/base.repository';

/**
 * 用户 Repository
 * 提供用户相关的数据访问方法，支持数据范围过滤
 */
@Injectable()
export class UserRepository extends BaseRepository {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly dataScopeService: DataScopeService,
  ) {
    super(prisma, dataScopeService);
  }

  /**
   * 分页查询用户（带数据范围过滤）
   */
  async findPage(
    userId: number | undefined,
    params: {
      pageNo?: number;
      pageSize?: number;
      deptId?: number;
      username?: string;
      status?: number;
    },
  ) {
    const { pageNo = 1, pageSize = 10, deptId, username, status } = params;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    // 构建基础查询条件
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (deptId !== undefined) {
      where.deptId = deptId;
    }

    if (username) {
      where.username = { contains: username, mode: 'insensitive' };
    }

    if (status !== undefined) {
      where.status = status;
    }

    // 如果没有用户ID（如管理员查看），不过滤
    if (!userId) {
      return this._findPageWithoutScope(where, skip, take);
    }

    // 应用数据范围过滤
    const scopedWhere = await this.applyDataScope(where, userId, 'user');

    return this._findPageWithoutScope(scopedWhere, skip, take);
  }

  /**
   * 不带数据范围的分页查询（内部方法）
   */
  private async _findPageWithoutScope(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
  ) {
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          gender: true,
          avatar: true,
          email: true,
          mobile: true,
          status: true,
          deptId: true,
          createdAt: true,
          updatedAt: true,
          dept: {
            select: {
              id: true,
              name: true,
            },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  roleName: true,
                  roleCode: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: list.map((item) => ({
        ...item,
        roles: item.roles.map((item) => item.role),
      })),
      total,
    };
  }

  /**
   * 获取用户详情（带数据范围过滤）
   */
  async findOne(userId: number, currentUserId: number | undefined) {
    const where: Prisma.UserWhereInput = {
      id: userId,
    };

    // 应用数据范围过滤
    const scopedWhere = currentUserId
      ? await this.applyDataScope(where, currentUserId, 'user')
      : where;

    const user = await this.prisma.user.findFirst({
      where: scopedWhere,
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        mobile: true,
        gender: true,
        avatar: true,
        status: true,
        deptId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedBy: true,
        dept: {
          select: {
            id: true,
            name: true,
          },
        },
        roles: {
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
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      roles: user.roles.map((item) => item.role),
    };
  }
}
