import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  DictTypeQueryDto,
  CreateDictItemDto,
  UpdateDictItemDto,
} from './dto/dict.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class DictService {
  constructor(private prisma: PrismaService) {}

  // ==================== 字典类型 ====================

  /** 分页查询字典类型 */
  async findTypePage(dto: DictTypeQueryDto) {
    const { pageNo = 1, pageSize = 10, dictName, dictCode, status } = dto;
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.DictTypeWhereInput = {
      deletedAt: null,
    };
    if (dictName) {
      where.dictName = { contains: dictName, mode: 'insensitive' };
    }
    if (dictCode) {
      where.dictCode = { contains: dictCode, mode: 'insensitive' };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [list, total] = await Promise.all([
      this.prisma.dictType.findMany({
        skip,
        take,
        where,
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dictType.count({ where }),
    ]);

    return { list, total, pageNo, pageSize };
  }

  /** 获取所有启用的字典类型 */
  async findAllTypes() {
    return this.prisma.dictType.findMany({
      where: { status: 1, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 获取单个字典类型（含字典项） */
  async findTypeById(id: number) {
    const dictType = await this.prisma.dictType.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sort: 'asc' },
        },
      },
    });
    if (!dictType) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }
    return dictType;
  }

  /** 按编码查询字典类型（含字典项） */
  async findTypeByCode(code: string) {
    const dictType = await this.prisma.dictType.findUnique({
      where: { dictCode: code },
      include: {
        items: {
          where: { status: 1, deletedAt: null },
          orderBy: { sort: 'asc' },
        },
      },
    });
    if (!dictType) {
      throw new NotFoundException(`字典编码 '${code}' 不存在`);
    }
    return dictType;
  }

  /** 创建字典类型 */
  async createType(dto: CreateDictTypeDto) {
    // 检查编码唯一性
    const existing = await this.prisma.dictType.findUnique({
      where: { dictCode: dto.dictCode },
    });
    if (existing) {
      throw new ConflictException(`字典编码 '${dto.dictCode}' 已存在`);
    }

    return this.prisma.dictType.create({
      data: {
        dictName: dto.dictName,
        dictCode: dto.dictCode,
        description: dto.description ?? '',
        status: dto.status ?? 1,
      },
    });
  }

  /** 更新字典类型 */
  async updateType(id: number, dto: UpdateDictTypeDto) {
    // 检查是否存在
    const existing = await this.prisma.dictType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }

    // 如果修改了编码，检查唯一性
    if (dto.dictCode && dto.dictCode !== existing.dictCode) {
      const codeExists = await this.prisma.dictType.findUnique({
        where: { dictCode: dto.dictCode },
      });
      if (codeExists) {
        throw new ConflictException(`字典编码 '${dto.dictCode}' 已存在`);
      }
    }

    return this.prisma.dictType.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status !== undefined ? +dto.status : undefined,
      },
    });
  }

  /** 删除字典类型（级联删除字典项） */
  async removeType(id: number) {
    const existing = await this.prisma.dictType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`字典类型 ID=${id} 不存在`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 先删除关联的字典项
      await tx.dictItem.deleteMany({ where: { dictTypeId: id } });
      // 再删除字典类型
      return tx.dictType.delete({ where: { id } });
    });
  }

  // ==================== 字典项 ====================

  /** 查询指定类型下的所有字典项 */
  async findItemsByTypeId(typeId: number) {
    return this.prisma.dictItem.findMany({
      where: { dictTypeId: typeId, deletedAt: null },
      orderBy: { sort: 'asc' },
    });
  }

  /** 按类型编码查询字典项（前端最常用） */
  async findItemsByTypeCode(code: string) {
    const dictType = await this.prisma.dictType.findFirst({
      where: { dictCode: code },
    });
    if (!dictType) {
      throw new NotFoundException(`字典编码 '${code}' 不存在`);
    }

    return this.prisma.dictItem.findMany({
      where: { dictTypeId: dictType.id, status: 1, deletedAt: null },
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        label: true,
        value: true,
        colorType: true,
        sort: true,
        status: true,
      },
    });
  }

  /** 创建字典项 */
  async createItem(dto: CreateDictItemDto) {
    // 检查字典类型是否存在
    const dictType = await this.prisma.dictType.findUnique({
      where: { id: dto.dictTypeId },
    });
    if (!dictType) {
      throw new NotFoundException(`字典类型 ID=${dto.dictTypeId} 不存在`);
    }

    return this.prisma.dictItem.create({
      data: {
        dictTypeId: dto.dictTypeId,
        label: dto.label,
        value: dto.value,
        colorType: dto.colorType ?? '',
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
      },
    });
  }

  /** 更新字典项 */
  async updateItem(id: number, dto: UpdateDictItemDto) {
    const existing = await this.prisma.dictItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`字典项 ID=${id} 不存在`);
    }

    return this.prisma.dictItem.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status !== undefined ? +dto.status : undefined,
        sort: dto.sort !== undefined ? +dto.sort : undefined,
      },
    });
  }

  /** 删除字典项 */
  async removeItem(id: number) {
    const existing = await this.prisma.dictItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`字典项 ID=${id} 不存在`);
    }

    return this.prisma.dictItem.delete({ where: { id } });
  }
}
