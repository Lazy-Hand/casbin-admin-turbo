import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  QueryMenuDto,
  QueryButtonPermissionPageDto,
} from './dto/permission.dto';
import { createPaginationResponse } from '@/common/dto/pagination.dto';

@ApiTags('权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: '获取所有权限' })
  async getAllPermissions() {
    return this.permissionService.getAllPermissions();
  }

  @Get('menus')
  @ApiOperation({ summary: '获取所有菜单权限' })
  async getMenuPermissions(@Query() query: QueryMenuDto) {
    return this.permissionService.getMenuPermissions(query);
  }

  @Get('menus-and-buttons')
  @ApiOperation({ summary: '获取菜单和按钮权限' })
  async getMenuAndButtonPermissions(@Query() query: QueryMenuDto) {
    return this.permissionService.getMenuAndButtonPermissions(query);
  }

  @Get('buttons/page')
  @ApiOperation({ summary: '分页查询按钮权限' })
  async getButtonPermissionsPage(@Query() query: QueryButtonPermissionPageDto) {
    const { list, total, pageNo, pageSize } =
      await this.permissionService.getButtonPermissionsPage(query);
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取权限详情' })
  async getPermissionById(@Param('id') id: string) {
    return this.permissionService.getPermissionById(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建权限' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新权限' })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  async deletePermission(@Param('id') id: string) {
    return this.permissionService.deletePermission(+id);
  }
}
