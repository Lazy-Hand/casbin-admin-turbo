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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { ApiSuccessResponse, ApiPaginatedResponse } from '@/common/decorators';
import { PostEntity } from './entities/post.entity';
import { createPaginationResponse } from '@/common/dto/pagination.dto';

@ApiTags('岗位管理')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('page')
  @ApiOperation({ summary: '分页查询岗位列表' })
  @ApiPaginatedResponse(PostEntity, {
    description: '成功返回岗位列表',
  })
  async findPage(@Query() searchPostDto: SearchPostDto) {
    const { list, total, pageNo, pageSize } = await this.postService.findPage(searchPostDto);
    return createPaginationResponse(list, total, pageNo, pageSize);
  }

  @Get()
  @ApiOperation({ summary: '获取所有岗位（不分页）' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功返回所有岗位',
    isArray: true,
  })
  async findAll() {
    return this.postService.findAll();
  }

  @Get('options')
  @ApiOperation({ summary: '获取启用的岗位选项' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功返回岗位选项',
    isArray: true,
  })
  async getOptions() {
    return this.postService.getOptions();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个岗位详情' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功返回岗位详情',
  })
  async findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建岗位' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功创建岗位',
  })
  async create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新岗位' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功更新岗位',
  })
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除岗位' })
  @ApiSuccessResponse(PostEntity, {
    description: '成功删除岗位',
  })
  async remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
