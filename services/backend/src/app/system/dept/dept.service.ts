import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, isNull, ne, sql } from 'drizzle-orm';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import {
  Dept,
  DrizzleService,
  joinOnWithSoftDelete,
  User,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '@/app/library/drizzle';

/**
 * 部门服务
 */
@Injectable()
export class DeptService {
  private readonly logger = new Logger(DeptService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * 分页查询部门列表
   */
  async findAll(query: QueryDeptDto) {
    const { pageNo = 1, pageSize = 10, name, status, parentId } = query;
    const where = and(
      withSoftDelete(Dept),
      name ? ilike(Dept.name, `%${name}%`) : undefined,
      status !== undefined ? eq(Dept.status, status) : undefined,
      parentId !== undefined ? eq(Dept.parentId, parentId) : undefined,
    );

    const [list, total] = await Promise.all([
      this.drizzle.db
        .select({
          id: Dept.id,
          name: Dept.name,
          parentId: Dept.parentId,
          ancestors: Dept.ancestors,
          leaderId: Dept.leaderId,
          status: Dept.status,
          sort: Dept.sort,
          remark: Dept.remark,
          createdAt: Dept.createdAt,
          updatedAt: Dept.updatedAt,
          leader: {
            id: User.id,
            username: User.username,
            nickname: User.nickname,
          },
          parent: {
            id: sql<number | null>`${Dept.id}`,
            name: sql<string | null>`${Dept.name}`,
          },
        })
        .from(Dept)
        .leftJoin(User, joinOnWithSoftDelete(User, eq(Dept.leaderId, User.id)))
        .where(where)
        .orderBy(asc(Dept.sort), asc(Dept.id))
        .limit(pageSize)
        .offset((pageNo - 1) * pageSize),
      this.drizzle.db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(Dept)
        .where(where),
    ]);

    return {
      list,
      total: total[0]?.total ?? 0,
      pageNo,
      pageSize,
    };
  }

  /**
   * 获取部门树
   */
  async findTree() {
    const depts = await this.drizzle.db
      .select({
        id: Dept.id,
        name: Dept.name,
        parentId: Dept.parentId,
        ancestors: Dept.ancestors,
        leaderId: Dept.leaderId,
        status: Dept.status,
        sort: Dept.sort,
        remark: Dept.remark,
        createdAt: Dept.createdAt,
        updatedAt: Dept.updatedAt,
        leader: {
          id: User.id,
          username: User.username,
          nickname: User.nickname,
        },
      })
      .from(Dept)
      .leftJoin(User, joinOnWithSoftDelete(User, eq(Dept.leaderId, User.id)))
      .where(and(withSoftDelete(Dept), eq(Dept.status, 1)))
      .orderBy(asc(Dept.sort), asc(Dept.id));

    return this.buildTree(depts);
  }

  /**
   * 构建树形结构
   */
  private buildTree(depts: any[], parentId: number | null = null): any[] {
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
    const rows = await this.drizzle.db
      .select({
        id: Dept.id,
        name: Dept.name,
        parentId: Dept.parentId,
        ancestors: Dept.ancestors,
        leaderId: Dept.leaderId,
        status: Dept.status,
        sort: Dept.sort,
        remark: Dept.remark,
        createdAt: Dept.createdAt,
        updatedAt: Dept.updatedAt,
        leader: {
          id: User.id,
          username: User.username,
          nickname: User.nickname,
        },
      })
      .from(Dept)
      .leftJoin(User, joinOnWithSoftDelete(User, eq(Dept.leaderId, User.id)))
      .where(withSoftDelete(Dept, eq(Dept.id, id)))
      .limit(1);

    const dept = rows[0];

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

    const createdDepts = await insertWithAudit(this.drizzle.db, Dept, {
        ...createDeptDto,
        ancestors,
        status: createDeptDto.status ?? 1,
        sort: createDeptDto.sort ?? 0,
        remark: createDeptDto.remark ?? null,
        updatedAt: new Date().toISOString(),
    });
    const dept = Array.isArray(createdDepts) ? createdDepts[0] : createdDepts;

    this.logger.log(`用户 ${userId} 创建部门 ${dept?.id}`);
    return dept ?? null;
  }

  /**
   * 更新部门
   */
  async update(id: number, updateDeptDto: UpdateDeptDto, userId: number) {
    const dept = await this.drizzle.findFirst(Dept, eq(Dept.id, id));

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
    const updatedDepts = await updateWithAudit(this.drizzle.db, Dept, eq(Dept.id, id), {
        ...updateDeptDto,
        ancestors: newAncestors,
        status: updateDeptDto.status !== undefined ? +updateDeptDto.status : undefined,
        sort: updateDeptDto.sort !== undefined ? +updateDeptDto.sort : undefined,
        remark: updateDeptDto.remark !== undefined ? updateDeptDto.remark : undefined,
    });
    const updated = Array.isArray(updatedDepts) ? updatedDepts[0] : updatedDepts;

    // 如果 ancestors 发生变化，需要更新所有子部门的 ancestors
    if (newAncestors !== dept.ancestors) {
      await this.updateChildrenAncestors(id, newAncestors ?? '0');
      // 清除数据范围缓存
      await this.dataScopeService.clearAllDataScopeCache();
    }

    this.logger.log(`用户 ${userId} 更新部门 ${id}`);
    return updated ?? null;
  }

  /**
   * 删除部门（软删除）
   */
  async remove(id: number, userId: number) {
    const dept = await this.drizzle.findFirst(Dept, eq(Dept.id, id));

    if (!dept) {
      throw new NotFoundException(`部门 ID ${id} 不存在`);
    }

    // 验证是否有子部门
    const hasChildren = await this.drizzle.db
      .select({ total: sql<number>`count(*)` })
      .from(Dept)
      .where(and(withSoftDelete(Dept), eq(Dept.parentId, id)));

    if ((hasChildren[0]?.total ?? 0) > 0) {
      throw new BadRequestException('请先删除子部门');
    }

    // 验证是否有用户
    const hasUsers = await this.drizzle.db
      .select({ total: sql<number>`count(*)` })
      .from(User)
      .where(and(withSoftDelete(User), eq(User.deptId, id)));

    if ((hasUsers[0]?.total ?? 0) > 0) {
      throw new BadRequestException('部门下存在用户，无法删除');
    }

    await softDeleteWhere(this.drizzle.db, Dept, eq(Dept.id, id));

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
    const count = await this.drizzle.db
      .select({ total: sql<number>`count(*)` })
      .from(Dept)
      .where(
        and(
          withSoftDelete(Dept),
          eq(Dept.name, name),
          parentId === null ? isNull(Dept.parentId) : eq(Dept.parentId, parentId),
          excludeId ? ne(Dept.id, excludeId) : undefined,
        ),
      );

    if ((count[0]?.total ?? 0) > 0) {
      throw new BadRequestException('同级部门下已存在相同名称的部门');
    }
  }

  /**
   * 验证负责人是否存在
   */
  private async validateLeaderExists(leaderId: number) {
    const user = await this.drizzle.findFirst(User, eq(User.id, leaderId));

    if (!user) {
      throw new BadRequestException('指定的用户不存在');
    }
  }

  /**
   * 验证父部门是否存在
   */
  private async validateParentExists(parentId: number) {
    const dept = await this.drizzle.findFirst(Dept, eq(Dept.id, parentId));

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

    const parent = await this.drizzle.findFirst(Dept, eq(Dept.id, parentId));

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
    const children = await this.drizzle.db
      .select({ id: Dept.id })
      .from(Dept)
      .where(and(withSoftDelete(Dept), eq(Dept.parentId, parentId)));

    for (const child of children) {
      const newAncestors = `${parentAncestors},${parentId}`;
      await updateWithAudit(this.drizzle.db, Dept, eq(Dept.id, child.id), {
        ancestors: newAncestors,
      });

      // 递归更新子部门的子部门
      await this.updateChildrenAncestors(child.id, newAncestors);
    }
  }
}
