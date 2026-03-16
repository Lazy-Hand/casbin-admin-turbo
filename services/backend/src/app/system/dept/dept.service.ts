import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma, Dept } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';
import { RedisService } from '@/app/library/redis/redis.service';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';

/**
 * 部门服务
 */
@Injectable()
export class DeptService {
  private readonly logger = new Logger(DeptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * 分页查询部门列表
   */
  async findAll(query: QueryDeptDto) {
    const { pageNo = 1, pageSize = 10, name, status, parentId } = query;
    const where: Prisma.DeptWhereInput = {
      deletedAt: null,
    };

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const [list, total] = await Promise.all([
      this.prisma.dept.findMany({
        where,
        skip: (pageNo - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        include: {
          leader: {
            select: { id: true, username: true, nickname: true },
          },
          parent: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.dept.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo,
      pageSize,
    };
  }

  /**
   * 获取部门树
   */
  async findTree() {
    const depts = await this.prisma.dept.findMany({
      where: {
        deletedAt: null,
        status: 1,
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        leader: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    return this.buildTree(depts);
  }

  /**
   * 构建树形结构
   */
  private buildTree(depts: Dept[], parentId: number | null = null): any[] {
    return depts
      .filter((dept) => dept.parentId === parentId)
      .map((dept) => ({
        ...dept,
        children: this.buildTree(depts, dept.id),
      }));
  }

  /**
   * 获取部门详情
   */
  async findOne(id: number) {
    const dept = await this.prisma.dept.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, username: true, nickname: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!dept) {
      throw new NotFoundException(`部门 ID ${id} 不存在`);
    }

    return dept;
  }

  /**
   * 创建部门
   */
  async create(createDeptDto: CreateDeptDto, userId: number) {
    const { name, parentId, leaderId } = createDeptDto;

    // 验证同级部门名称唯一性
    await this.validateDuplicateName(name, parentId ?? null);

    // 验证负责人是否存在
    if (leaderId) {
      await this.validateLeaderExists(leaderId);
    }

    // 验证父部门是否存在
    if (parentId) {
      await this.validateParentExists(parentId);
    }

    // 计算 ancestors
    const ancestors = await this.calculateAncestors(parentId);

    const dept = await this.prisma.dept.create({
      data: {
        ...createDeptDto,
        ancestors,
        createdBy: userId,
      },
      include: {
        leader: {
          select: { id: true, username: true, nickname: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`用户 ${userId} 创建部门 ${dept.id}`);
    return dept;
  }

  /**
   * 更新部门
   */
  async update(id: number, updateDeptDto: UpdateDeptDto, userId: number) {
    const dept = await this.prisma.dept.findUnique({
      where: { id },
    });

    if (!dept) {
      throw new NotFoundException(`部门 ID ${id} 不存在`);
    }

    const { name, parentId, leaderId } = updateDeptDto;

    // 验证同级部门名称唯一性（排除自己）
    if (name && name !== dept.name) {
      await this.validateDuplicateName(name, parentId ?? dept.parentId, id);
    }

    // 验证负责人是否存在
    if (leaderId && leaderId !== dept.leaderId) {
      await this.validateLeaderExists(leaderId);
    }

    // 验证父部门是否存在
    if (parentId !== undefined && parentId !== dept.parentId) {
      if (parentId) {
        // 验证不能将部门移动到自己的子部门下
        await this.validateCircularReference(id, parentId);
        await this.validateParentExists(parentId);
      }
    }

    // 计算新的 ancestors
    let newAncestors = dept.ancestors;
    if (parentId !== undefined && parentId !== dept.parentId) {
      newAncestors = await this.calculateAncestors(parentId);
    }

    // 更新部门
    const updated = await this.prisma.dept.update({
      where: { id },
      data: {
        ...updateDeptDto,
        ancestors: newAncestors,
        updatedBy: userId,
      },
      include: {
        leader: {
          select: { id: true, username: true, nickname: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    // 如果 ancestors 发生变化，需要更新所有子部门的 ancestors
    if (newAncestors !== dept.ancestors) {
      await this.updateChildrenAncestors(id, newAncestors ?? '0');
      // 清除数据范围缓存
      await this.dataScopeService.clearAllDataScopeCache();
    }

    this.logger.log(`用户 ${userId} 更新部门 ${id}`);
    return updated;
  }

  /**
   * 删除部门（软删除）
   */
  async remove(id: number, userId: number) {
    const dept = await this.prisma.dept.findUnique({
      where: { id },
    });

    if (!dept) {
      throw new NotFoundException(`部门 ID ${id} 不存在`);
    }

    // 验证是否有子部门
    const hasChildren = await this.prisma.dept.count({
      where: {
        parentId: id,
        deletedAt: null,
      },
    });

    if (hasChildren > 0) {
      throw new BadRequestException('请先删除子部门');
    }

    // 验证是否有用户
    const hasUsers = await this.prisma.user.count({
      where: {
        deptId: id,
        deletedAt: null,
      },
    });

    if (hasUsers > 0) {
      throw new BadRequestException('部门下存在用户，无法删除');
    }

    // 软删除
    await this.prisma.dept.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    this.logger.log(`用户 ${userId} 删除部门 ${id}`);
    return { message: '删除成功' };
  }

  /**
   * 验证同级部门名称唯一性
   */
  private async validateDuplicateName(
    name: string,
    parentId: number | null,
    excludeId?: number,
  ) {
    const where: Prisma.DeptWhereInput = {
      name,
      parentId,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.dept.count({ where });

    if (count > 0) {
      throw new BadRequestException('同级部门下已存在相同名称的部门');
    }
  }

  /**
   * 验证负责人是否存在
   */
  private async validateLeaderExists(leaderId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: leaderId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('指定的用户不存在');
    }
  }

  /**
   * 验证父部门是否存在
   */
  private async validateParentExists(parentId: number) {
    const dept = await this.prisma.dept.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!dept) {
      throw new BadRequestException('父部门不存在');
    }
  }

  /**
   * 验证循环引用
   */
  private async validateCircularReference(deptId: number, newParentId: number) {
    // 检查新父部门是否是当前部门的子部门
    const descendantIds =
      await this.dataScopeService.getDescendantDeptIds(deptId);

    if (descendantIds.includes(newParentId)) {
      throw new BadRequestException('不能将部门移动到其子部门下');
    }
  }

  /**
   * 计算 ancestors 字段
   */
  private async calculateAncestors(
    parentId: number | null | undefined,
  ): Promise<string> {
    if (!parentId) {
      return '0';
    }

    const parent = await this.prisma.dept.findUnique({
      where: { id: parentId },
      select: { ancestors: true },
    });

    if (!parent) {
      throw new BadRequestException('父部门不存在');
    }

    return `${parent.ancestors},${parentId}`;
  }

  /**
   * 更新子部门的 ancestors
   */
  private async updateChildrenAncestors(
    parentId: number,
    parentAncestors: string,
  ) {
    // 获取所有子部门
    const children = await this.prisma.dept.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      select: { id: true, ancestors: true },
    });

    for (const child of children) {
      const newAncestors = `${parentAncestors},${parentId}`;
      await this.prisma.dept.update({
        where: { id: child.id },
        data: { ancestors: newAncestors },
      });

      // 递归更新子部门的子部门
      await this.updateChildrenAncestors(child.id, newAncestors);
    }
  }
}
