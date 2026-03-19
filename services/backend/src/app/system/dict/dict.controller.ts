import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DictService } from './dict.service';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  DictTypeQueryDto,
  CreateDictItemDto,
  UpdateDictItemDto,
} from './dto/dict.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { DictTypeEntity, DictItemEntity } from './entities/dict.entity';
import { createPaginationResponse } from '@/common/dto/pagination.dto';
import { PaginationPipe } from '@/common/pipes/pagination.pipe';

@ApiTags('字典管理')
@Controller()
@ApiBearerAuth('JWT-auth')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  // ==================== 字典类型 ====================

  @Get('dict-types/page')
  @ApiOperation({ summary: '分页查询字典类型' })
  @ApiPaginatedResponse(DictTypeEntity, {
    description: '成功返回字典类型列表',
  })
  async findTypePage(@Query(PaginationPipe) query: DictTypeQueryDto) {
    const { list, total, pageNo, pageSize } = await this.dictService.findTypePage(query);
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get('dict-types')
  @ApiOperation({ summary: '获取所有启用的字典类型' })
  @ApiSuccessResponse(DictTypeEntity, {
    description: '成功返回字典类型列表',
    isArray: true,
  })
  async findAllTypes() {
    return this.dictService.findAllTypes();
  }

  @Get('dict-types/:id')
  @ApiOperation({ summary: '获取字典类型详情（含字典项）' })
  @ApiSuccessResponse(DictTypeEntity, {
    description: '成功返回字典类型详情',
  })
  async findTypeById(@Param('id') id: string) {
    return this.dictService.findTypeById(+id);
  }

  @Post('dict-types')
  @ApiOperation({ summary: '创建字典类型' })
  @ApiSuccessResponse(DictTypeEntity, {
    description: '成功创建字典类型',
  })
  async createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto);
  }

  @Patch('dict-types/:id')
  @ApiOperation({ summary: '更新字典类型' })
  @ApiSuccessResponse(DictTypeEntity, {
    description: '成功更新字典类型',
  })
  async updateType(@Param('id') id: string, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(+id, dto);
  }

  @Delete('dict-types/:id')
  @ApiOperation({ summary: '删除字典类型（级联删除字典项）' })
  @ApiSuccessResponse(DictTypeEntity, {
    description: '成功删除字典类型',
  })
  async removeType(@Param('id') id: string) {
    return this.dictService.removeType(+id);
  }

  // ==================== 字典项 ====================

  @Get('dict-items/type/:typeId')
  @ApiOperation({ summary: '按类型ID查询字典项' })
  @ApiSuccessResponse(DictItemEntity, {
    description: '成功返回字典项列表',
    isArray: true,
  })
  async findItemsByTypeId(@Param('typeId') typeId: string) {
    return this.dictService.findItemsByTypeId(+typeId);
  }

  @Get('dict-items/code/:code')
  @ApiOperation({ summary: '按类型编码查询字典项（前端常用）' })
  @ApiSuccessResponse(DictItemEntity, {
    description: '成功返回字典项列表',
    isArray: true,
  })
  async findItemsByTypeCode(@Param('code') code: string) {
    return this.dictService.findItemsByTypeCode(code);
  }

  @Post('dict-items')
  @ApiOperation({ summary: '创建字典项' })
  @ApiSuccessResponse(DictItemEntity, {
    description: '成功创建字典项',
  })
  async createItem(@Body() dto: CreateDictItemDto) {
    return this.dictService.createItem(dto);
  }

  @Patch('dict-items/:id')
  @ApiOperation({ summary: '更新字典项' })
  @ApiSuccessResponse(DictItemEntity, {
    description: '成功更新字典项',
  })
  async updateItem(@Param('id') id: string, @Body() dto: UpdateDictItemDto) {
    return this.dictService.updateItem(+id, dto);
  }

  @Delete('dict-items/:id')
  @ApiOperation({ summary: '删除字典项' })
  @ApiSuccessResponse(DictItemEntity, {
    description: '成功删除字典项',
  })
  async removeItem(@Param('id') id: string) {
    return this.dictService.removeItem(+id);
  }
}
