import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Can } from '@/app/library/casl/decorators/ability.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '../user/entities/user.entity';

@ApiTags('部门管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('depts')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /**
   * 分页查询部门列表
   */
  @Get()
  @Can('list', 'Dept')
  @ApiOperation({ summary: '获取部门列表' })
  findAll(@Query() query: QueryDeptDto) {
    return this.deptService.findAll(query);
  }

  /**
   * 获取部门树
   */
  @Get('tree')
  @Can('list', 'Dept')
  @ApiOperation({ summary: '获取部门树' })
  findTree() {
    return this.deptService.findTree();
  }

  /**
   * 获取部门详情
   */
  @Get(':id')
  @Can('detail', 'Dept')
  @ApiOperation({ summary: '获取部门详情' })
  findOne(@Param('id') id: string) {
    return this.deptService.findOne(+id);
  }

  /**
   * 创建部门
   */
  @Post()
  @Can('create', 'Dept')
  @ApiOperation({ summary: '创建部门' })
  create(@Body() createDeptDto: CreateDeptDto, @CurrentUser() user: UserEntity) {
    return this.deptService.create(createDeptDto, user.id);
  }

  /**
   * 更新部门
   */
  @Put(':id')
  @Can('update', 'Dept')
  @ApiOperation({ summary: '更新部门' })
  update(
    @Param('id') id: string,
    @Body() updateDeptDto: UpdateDeptDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.deptService.update(+id, updateDeptDto, user.id);
  }

  /**
   * 删除部门
   */
  @Delete(':id')
  @Can('delete', 'Dept')
  @ApiOperation({ summary: '删除部门' })
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.deptService.remove(+id, user.id);
  }
}
