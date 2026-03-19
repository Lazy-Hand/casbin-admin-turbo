import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { CreateConfigDto, UpdateConfigDto, ConfigQueryDto } from './dto/config.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { ConfigEntity } from './entities/config.entity';
import { createPaginationResponse } from '@/common/dto/pagination.dto';
import { PaginationPipe } from '@/common/pipes/pagination.pipe';
import { Can } from '@/app/library/casl/decorators/ability.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('系统配置')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('configs/page')
  @Can('list', 'Config')
  @ApiOperation({ summary: '分页查询配置列表' })
  @ApiPaginatedResponse(ConfigEntity, {
    description: '成功返回配置列表',
  })
  async findPage(@Query(PaginationPipe) query: ConfigQueryDto) {
    const { list, total, pageNo, pageSize } = await this.configService.findPage(query);
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get('configs')
  @Can('list', 'Config')
  @ApiOperation({ summary: '获取所有启用的配置' })
  @ApiSuccessResponse(ConfigEntity, {
    description: '成功返回配置列表',
    isArray: true,
  })
  async findAll() {
    return this.configService.findAll();
  }

  @Get('configs/keys/batch')
  @Can('read', 'Config')
  @ApiOperation({ summary: '批量获取配置值' })
  @ApiSuccessResponse(Object, {
    description: '成功返回配置值对象',
  })
  async getByKeys(@Query('keys') keys: string) {
    if (!keys?.trim()) {
      throw new BadRequestException('keys 参数不能为空');
    }
    const keyList = keys.split(',').filter((k) => k.trim());
    if (keyList.length === 0) {
      return {};
    }
    return this.configService.getByKeys(keyList);
  }

  @Get('configs/key/:key')
  @Can('read', 'Config')
  @ApiOperation({ summary: '根据 key 获取配置值' })
  @ApiSuccessResponse(String, {
    description: '成功返回配置值',
  })
  async getByKey(@Param('key') key: string) {
    const value = await this.configService.getByKey(key);
    if (value === null) {
      throw new NotFoundException(`配置键 '${key}' 不存在或已禁用`);
    }
    return value;
  }

  @Get('configs/:id')
  @Can('read', 'Config')
  @ApiOperation({ summary: '根据 ID 获取配置详情' })
  @ApiSuccessResponse(ConfigEntity, {
    description: '成功返回配置详情',
  })
  async findOne(@Param('id') id: string) {
    return this.configService.findOne(+id);
  }

  @Post('configs')
  @Can('create', 'Config')
  @ApiOperation({ summary: '创建配置' })
  @ApiSuccessResponse(ConfigEntity, {
    description: '成功创建配置',
  })
  async create(@Body() dto: CreateConfigDto) {
    return this.configService.create(dto);
  }

  @Patch('configs/:id')
  @Can('update', 'Config')
  @ApiOperation({ summary: '更新配置' })
  @ApiSuccessResponse(ConfigEntity, {
    description: '成功更新配置',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configService.update(+id, dto);
  }

  @Delete('configs/:id')
  @Can('delete', 'Config')
  @ApiOperation({ summary: '删除配置' })
  @ApiSuccessResponse(ConfigEntity, {
    description: '成功删除配置',
  })
  async remove(@Param('id') id: string) {
    return this.configService.remove(+id);
  }
}
