import { PrismaService } from 'nestjs-prisma';
import { DataScopeService } from '@/app/library/data-scope/data-scope.service';
import { Injectable } from '@nestjs/common';

/**
 * 数据范围配置接口
 */
export interface DataScopeConfig {
  scope: 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD';
  deptId: number | null;
  customDepts?: number[];
}

/**
 * Repository 基类
 * 提供数据范围过滤等通用功能
 */
@Injectable()
export abstract class BaseRepository {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * 应用数据范围过滤
   * @param where 基础查询条件
   * @param userId 当前用户ID
   * @param resourceType 资源类型（如 'user', 'role'）
   * @returns 合并了数据范围过滤的查询条件
   */
  protected async applyDataScope(
    where: Record<string, any>,
    userId: number,
    resourceType: string,
  ): Promise<Record<string, any>> {
    try {
      // 获取用户信息，检查是否为管理员
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true, deptId: true },
      });

      // 管理员跳过数据过滤
      if (user?.isAdmin) {
        return where;
      }

      // 获取用户的数据范围配置
      const dataScopeConfig = await this.dataScopeService.getUserDataScope(
        userId,
        resourceType,
      );

      // 构建数据范围过滤条件
      const scopeFilter = await this.dataScopeService.buildWhereClause(
        dataScopeConfig,
      );

      // 合并基础条件和数据范围条件
      return { ...where, ...scopeFilter };
    } catch (error) {
      // 数据范围异常时拒绝访问，避免越权读取
      return {
        AND: [where, { id: -1 }],
      };
    }
  }
}
