import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  AssignRolesToUserDto,
} from './dto/role.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { RoleEntity } from './entities/role.entity';
import { PaginationDto, createPaginationResponse } from '@/common/dto/pagination.dto';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ==================== 角色 CRUD ====================

  @Get('page')
  @ApiOperation({ summary: '分页查询角色列表' })
  @ApiPaginatedResponse(RoleEntity, {
    description: '成功返回角色列表',
  })
  async findPage(@Query() paginationDto: PaginationDto) {
    const { list, total, pageNo, pageSize } = await this.roleService.findPage(paginationDto);
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get()
  @ApiOperation({ summary: '获取所有角色（不分页）' })
  @ApiSuccessResponse(RoleEntity, {
    description: '成功返回所有角色',
    isArray: true,
  })
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个角色详情' })
  @ApiSuccessResponse(RoleEntity, {
    description: '成功返回角色详情',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiSuccessResponse(RoleEntity, {
    description: '成功创建角色',
  })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiSuccessResponse(RoleEntity, {
    description: '成功更新角色',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiSuccessResponse(RoleEntity, {
    description: '成功删除角色',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }

  // ==================== 角色-权限关联 ====================

  @Get(':roleId/permissions')
  @ApiOperation({ summary: '获取角色的所有权限' })
  async getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.roleService.getRolePermissions(roleId);
  }

  @Post(':roleId/permissions/batch')
  @ApiOperation({ summary: '批量分配权限给角色' })
  async assignPermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.roleService.assignPermissions(roleId, dto.permissionIds);
  }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: '给角色分配单个权限' })
  async assignPermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.roleService.assignPermission(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: '移除角色的权限' })
  async removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.roleService.removePermission(roleId, permissionId);
  }

  // ==================== 用户-角色关联 ====================

  @Get('users/:userId')
  @ApiOperation({ summary: '获取用户的所有角色' })
  async getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    return this.roleService.getUserRoles(userId);
  }

  @Post('users/:userId/:roleId')
  @ApiOperation({ summary: '给用户分配单个角色' })
  async assignRoleToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.roleService.assignRoleToUser(userId, roleId);
  }

  @Post('users/:userId/batch')
  @ApiOperation({ summary: '批量分配角色给用户' })
  async assignRolesToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignRolesToUserDto,
  ) {
    return this.roleService.assignRolesToUser(userId, dto.roleIds);
  }

  @Delete('users/:userId/:roleId')
  @ApiOperation({ summary: '移除用户的角色' })
  async removeRoleFromUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.roleService.removeRoleFromUser(userId, roleId);
  }
}
