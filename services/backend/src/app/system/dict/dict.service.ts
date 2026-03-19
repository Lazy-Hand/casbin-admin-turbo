import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  DictTypeQueryDto,
  CreateDictItemDto,
  UpdateDictItemDto,
} from './dto/dict.dto';
import {
  DictItem,
  DictType,
  DrizzleService,
  insertWithAudit,
  softDeleteWhere,
  updateWithAudit,
  withSoftDelete,
} from '../../library/drizzle';

@Injectable()
export class DictService {
  constructor(private readonly drizzle: DrizzleService) {}

  // ==================== 字典类型 ====================

  /** 分页查询字典类型 */
  async findTypePage(dto: DictTypeQueryDto) {
    const { pageNo = 1, pageSize = 10, dictName, dictCode, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const where = and(
      withSoftDelete(DictType),
      dictName ? ilike(DictType.dictName, `%${dictName}%`) : undefined,
      dictCode ? ilike(DictType.dictCode, `%${dictCode}%`) : undefined,
      status !== undefined ? eq(DictType.status, status) : undefined,
    );

    const [types, totalRows, itemCounts] = await Promise.all([
      this.drizzle.db
        .select()
        .from(DictType)
        .where(where)
        .orderBy(desc(DictType.createdAt))
        .limit(pageSize)
        .offset(skip),
      this.drizzle.db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(DictType)
        .where(where),
      this.drizzle.db
        .select({
          dictTypeId: DictItem.dictTypeId,
          count: sql<number>`count(*)`,
        })
        .from(DictItem)
        .where(withSoftDelete(DictItem))
        .groupBy(DictItem.dictTypeId),
    ]);

    const countMap = new Map(itemCounts.map((item) => [item.dictTypeId, item.count]));
    const list = types.map((type) => ({
      ...type,
      _count: {
        items: countMap.get(type.id) ?? 0,
      },
    }));

    return { list, total: totalRows[0]?.total ?? 0, pageNo, pageSize };
  }

  /** 获取所有启用的字典类型 */
  async findAllTypes() {
    return this.drizzle.db
      .select()
      .from(DictType)
      .where(and(withSoftDelete(DictType), eq(DictType.status, 1)))
      .orderBy(desc(DictType.createdAt));
  }

  /** 获取单个字典类型（含字典项） */
  async findTypeById(id: number) {
    const [dictType, items] = await Promise.all([
      this.drizzle.findFirst(DictType, eq(DictType.id, id)),
      this.drizzle.db
        .select()
        .from(DictItem)
        .where(and(withSoftDelete(DictItem), eq(DictItem.dictTypeId, id)))
        .orderBy(asc(DictItem.sort)),
    ]);
    if (!dictType) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }
    return {
      ...dictType,
      items,
    };
  }

  /** 按编码查询字典类型（含字典项） */
  async findTypeByCode(code: string) {
    const dictType = await this.drizzle.findFirst(DictType, eq(DictType.dictCode, code));
    if (!dictType) {
      throw new NotFoundException(`字典编码 '${code}' 不存在`);
    }

    const items = await this.drizzle.db
      .select()
      .from(DictItem)
      .where(
        and(withSoftDelete(DictItem), eq(DictItem.dictTypeId, dictType.id), eq(DictItem.status, 1)),
      )
      .orderBy(asc(DictItem.sort));

    return {
      ...dictType,
      items,
    };
  }

  /** 创建字典类型 */
  async createType(dto: CreateDictTypeDto) {
    const existing = await this.drizzle.findFirst(DictType, eq(DictType.dictCode, dto.dictCode));
    if (existing) {
      throw new ConflictException(`字典编码 '${dto.dictCode}' 已存在`);
    }

    const createdTypes = await insertWithAudit(this.drizzle.db, DictType, {
      dictName: dto.dictName,
      dictCode: dto.dictCode,
      description: dto.description ?? '',
      status: dto.status ?? 1,
      updatedAt: new Date().toISOString(),
    });
    return Array.isArray(createdTypes) ? (createdTypes[0] ?? null) : createdTypes;
  }

  /** 更新字典类型 */
  async updateType(id: number, dto: UpdateDictTypeDto) {
    const existing = await this.drizzle.findFirst(DictType, eq(DictType.id, id));
    if (!existing) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }

    if (dto.dictCode && dto.dictCode !== existing.dictCode) {
      const codeExists = await this.drizzle.findFirst(
        DictType,
        eq(DictType.dictCode, dto.dictCode),
      );
      if (codeExists) {
        throw new ConflictException(`字典编码 '${dto.dictCode}' 已存在`);
      }
    }

    const updatedTypes = await updateWithAudit(this.drizzle.db, DictType, eq(DictType.id, id), {
      ...dto,
      status: dto.status !== undefined ? +dto.status : undefined,
    });
    return Array.isArray(updatedTypes) ? (updatedTypes[0] ?? null) : updatedTypes;
  }

  /** 删除字典类型（级联删除字典项） */
  async removeType(id: number) {
    const existing = await this.drizzle.findFirst(DictType, eq(DictType.id, id));
    if (!existing) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }

    return this.drizzle.db.transaction(async (tx: any) => {
      await softDeleteWhere(tx, DictItem, eq(DictItem.dictTypeId, id));
      const deletedTypes = await softDeleteWhere(tx, DictType, eq(DictType.id, id));
      return Array.isArray(deletedTypes) ? (deletedTypes[0] ?? null) : deletedTypes;
    });
  }

  // ==================== 字典项 ====================

  /** 查询指定类型下的所有字典项 */
  async findItemsByTypeId(typeId: number) {
    return this.drizzle.db
      .select()
      .from(DictItem)
      .where(and(withSoftDelete(DictItem), eq(DictItem.dictTypeId, typeId)))
      .orderBy(asc(DictItem.sort));
  }

  /** 按类型编码查询字典项（前端最常用） */
  async findItemsByTypeCode(code: string) {
    const dictType = await this.drizzle.findFirst(DictType, eq(DictType.dictCode, code));
    if (!dictType) {
      throw new NotFoundException(`字典编码 '${code}' 不存在`);
    }

    return this.drizzle.db
      .select({
        id: DictItem.id,
        label: DictItem.label,
        value: DictItem.value,
        colorType: DictItem.colorType,
        sort: DictItem.sort,
        status: DictItem.status,
      })
      .from(DictItem)
      .where(
        and(withSoftDelete(DictItem), eq(DictItem.dictTypeId, dictType.id), eq(DictItem.status, 1)),
      )
      .orderBy(asc(DictItem.sort));
  }

  /** 创建字典项 */
  async createItem(dto: CreateDictItemDto) {
    const dictType = await this.drizzle.findFirst(DictType, eq(DictType.id, dto.dictTypeId));
    if (!dictType) {
      throw new NotFoundException(`字典类型 ID=${dto.dictTypeId} 不存在`);
    }

    const createdItems = await insertWithAudit(this.drizzle.db, DictItem, {
      dictTypeId: dto.dictTypeId,
      label: dto.label,
      value: dto.value,
      colorType: dto.colorType ?? '',
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
      updatedAt: new Date().toISOString(),
    });
    return Array.isArray(createdItems) ? (createdItems[0] ?? null) : createdItems;
  }

  /** 更新字典项 */
  async updateItem(id: number, dto: UpdateDictItemDto) {
    const existing = await this.drizzle.findFirst(DictItem, eq(DictItem.id, id));
    if (!existing) {
      throw new NotFoundException(`字典项 ID=${id} 不存在`);
    }

    const updatedItems = await updateWithAudit(this.drizzle.db, DictItem, eq(DictItem.id, id), {
      ...dto,
      status: dto.status !== undefined ? +dto.status : undefined,
      sort: dto.sort !== undefined ? +dto.sort : undefined,
    });
    return Array.isArray(updatedItems) ? (updatedItems[0] ?? null) : updatedItems;
  }

  /** 删除字典项 */
  async removeItem(id: number) {
    const existing = await this.drizzle.findFirst(DictItem, eq(DictItem.id, id));
    if (!existing) {
      throw new NotFoundException(`字典项 ID=${id} 不存在`);
    }

    const deletedItems = await softDeleteWhere(this.drizzle.db, DictItem, eq(DictItem.id, id));
    return Array.isArray(deletedItems) ? (deletedItems[0] ?? null) : deletedItems;
  }
}
