import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { UserEntity } from './entities/user.entity';
import { createPaginationResponse } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('page')
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiPaginatedResponse(UserEntity, {
    description: '成功返回用户列表',
  })
  async findPage(@Query() searchDto: SearchUserDto, @CurrentUser() user: { id: number }) {
    const { list, total } = await this.userService.findPage(searchDto, user.id);
    return createPaginationResponse(list, total, searchDto.pageNo ?? 1, searchDto.pageSize ?? 10);
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户（不分页）' })
  @ApiSuccessResponse(UserEntity, {
    description: '成功返回所有用户',
    isArray: true,
  })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':userId')
  @ApiOperation({ summary: '获取用户详情（含权限）' })
  @ApiSuccessResponse(UserEntity, {
    description: '成功返回用户详情',
  })
  async getUserDetail(@Param('userId') userId: string, @CurrentUser() user: { id: number }) {
    return this.userService.getUserDetail(+userId, user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiSuccessResponse(UserEntity, {
    description: '成功创建用户',
  })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiSuccessResponse(UserEntity, {
    description: '成功更新用户',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiSuccessResponse(UserEntity, {
    description: '成功删除用户',
  })
  async delete(@Param('id') id: string) {
    return this.userService.delete(+id);
  }
}
