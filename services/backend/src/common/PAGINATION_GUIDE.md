# 分页查询使用指南

本文档介绍如何在项目中使用分页查询功能。

## 核心组件

### 1. PaginationDto

基础分页查询 DTO，包含 `pageNo` 和 `pageSize` 字段。

```typescript
export class PaginationDto {
  pageNo?: number = 1;      // 页码（从 1 开始）
  pageSize?: number = 10;   // 每页数量（最大 100）
}
```

### 2. PrismaPaginationParams

Prisma 分页参数接口，包含 `skip` 和 `take` 字段。

```typescript
export interface PrismaPaginationParams {
  skip: number;   // 跳过的记录数
  take: number;   // 获取的记录数
}
```

### 3. PaginationResponseDto

分页响应 DTO，包含完整的分页信息。

```typescript
export class PaginationResponseDto<T> {
  list: T[];           // 数据列表
  total: number;       // 总记录数
  pageNo: number;      // 当前页码
  pageSize: number;    // 每页数量
  totalPages: number;  // 总页数
  hasNext: boolean;    // 是否有下一页
  hasPrev: boolean;    // 是否有上一页
}
```

## 使用方法

### 方法 1: 使用 @Pagination 装饰器（推荐）

最简单的方式，自动转换为 Prisma 格式。

```typescript
import { Controller, Get } from '@nestjs/common';
import { Pagination } from '../common/decorators/pagination.decorator';
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { createPaginationResponse } from '../common/dto/pagination.dto';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiPaginatedResponse(UserDto, { description: '获取用户列表' })
  async getUsers(
    @Pagination() pagination: { skip: number; take: number },
  ) {
    // 直接使用 Prisma 查询
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count(),
    ]);

    // 计算原始分页参数
    const pageNo = Math.floor(pagination.skip / pagination.take) + 1;
    const pageSize = pagination.take;

    // 返回分页响应
    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

**请求示例：**
```bash
GET /users?pageNo=1&pageSize=10
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "list": [
      { "id": 1, "username": "user1", "email": "user1@example.com" },
      { "id": 2, "username": "user2", "email": "user2@example.com" }
    ],
    "total": 50,
    "pageNo": 1,
    "pageSize": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "success",
  "success": true
}
```

### 方法 2: 使用 @RawPagination 装饰器

获取原始的 pageNo 和 pageSize，适合需要手动处理的场景。

```typescript
import { RawPagination } from '../common/decorators/pagination.decorator';

@Get()
@ApiPaginatedResponse(UserDto)
async getUsers(
  @RawPagination() pagination: { pageNo: number; pageSize: number },
) {
  const { pageNo, pageSize } = pagination;

  // 手动计算 skip 和 take
  const skip = (pageNo - 1) * pageSize;
  const take = pageSize;

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({ skip, take }),
    this.prisma.user.count(),
  ]);

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

### 方法 3: 使用 Query DTO

通过 DTO 验证参数，适合需要额外验证的场景。

```typescript
import { Query } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';

@Get()
@ApiPaginatedResponse(UserDto)
async getUsers(@Query() paginationDto: PaginationDto) {
  const { pageNo = 1, pageSize = 10 } = paginationDto;

  const skip = (pageNo - 1) * pageSize;
  const take = pageSize;

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({ skip, take }),
    this.prisma.user.count(),
  ]);

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

### 方法 4: 带搜索条件的分页查询

结合搜索条件使用分页。

```typescript
import { Query } from '@nestjs/common';
import { Pagination } from '../common/decorators/pagination.decorator';
import { ApiQuery } from '@nestjs/swagger';

@Get('search')
@ApiQuery({ name: 'pageNo', required: false, type: Number })
@ApiQuery({ name: 'pageSize', required: false, type: Number })
@ApiQuery({ name: 'keyword', required: false, type: String })
@ApiPaginatedResponse(UserDto)
async searchUsers(
  @Pagination() pagination: { skip: number; take: number },
  @Query('keyword') keyword?: string,
) {
  // 构建查询条件
  const where = keyword
    ? {
        OR: [
          { username: { contains: keyword } },
          { email: { contains: keyword } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
    }),
    this.prisma.user.count({ where }),
  ]);

  const pageNo = Math.floor(pagination.skip / pagination.take) + 1;
  const pageSize = pagination.take;

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

**请求示例：**
```bash
GET /users/search?pageNo=1&pageSize=10&keyword=john
```

## 扩展 PaginationDto

如果需要添加额外的查询参数，可以继承 `PaginationDto`。

```typescript
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UserQueryDto extends PaginationDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ 
    description: '角色过滤', 
    enum: ['user', 'admin'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @ApiProperty({ 
    description: '排序字段', 
    enum: ['createdAt', 'username'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'username'])
  sortBy?: string;

  @ApiProperty({ 
    description: '排序方向', 
    enum: ['asc', 'desc'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
```

**使用示例：**

```typescript
@Get()
@ApiPaginatedResponse(UserDto)
async getUsers(@Query() query: UserQueryDto) {
  const { pageNo = 1, pageSize = 10, keyword, role, sortBy, sortOrder } = query;

  const skip = (pageNo - 1) * pageSize;
  const take = pageSize;

  // 构建查询条件
  const where: any = {};
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { email: { contains: keyword } },
    ];
  }
  if (role) {
    where.role = role;
  }

  // 构建排序
  const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
    }),
    this.prisma.user.count({ where }),
  ]);

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

## Swagger 文档

使用 `@ApiPaginatedResponse` 装饰器自动生成分页响应文档。

```typescript
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { ApiQuery } from '@nestjs/swagger';

@Get()
@ApiQuery({ name: 'pageNo', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
@ApiPaginatedResponse(UserDto, { description: '获取用户列表' })
async getUsers(@Pagination() pagination: { skip: number; take: number }) {
  // ...
}
```

这将在 Swagger 文档中生成完整的分页响应格式。

## 工具函数

### createPaginationResponse

创建标准的分页响应对象。

```typescript
import { createPaginationResponse } from '../common/dto/pagination.dto';

const response = createPaginationResponse(
  users,      // 数据列表
  total,      // 总记录数
  pageNo,     // 当前页码
  pageSize,   // 每页数量
);
```

## 参数验证

`PaginationDto` 包含以下验证规则：

- `pageNo`: 必须是整数，最小值为 1，默认值为 1
- `pageSize`: 必须是整数，最小值为 1，最大值为 100，默认值为 10

如果传入无效参数，将返回 400 错误。

## 最佳实践

1. **使用 @Pagination 装饰器**
   - 最简单直接，自动转换为 Prisma 格式
   - 适合大多数场景

2. **使用 createPaginationResponse**
   - 统一的分页响应格式
   - 自动计算总页数、是否有下一页等信息

3. **限制 pageSize 最大值**
   - 默认最大值为 100
   - 防止一次查询过多数据

4. **使用 Promise.all 并行查询**
   - 同时查询数据和总数
   - 提高查询性能

5. **添加索引**
   - 为常用的排序字段添加数据库索引
   - 提高分页查询性能

## 示例端点

查看 `src/examples/pagination-example.controller.ts` 获取完整示例：

- `GET /examples/pagination/method1` - 使用 @Pagination 装饰器
- `GET /examples/pagination/method2` - 使用 @RawPagination 装饰器
- `GET /examples/pagination/method3` - 使用 Query DTO
- `GET /examples/pagination/search` - 带搜索条件的分页查询

## 测试

```bash
# 基础分页查询
curl "http://localhost:3000/examples/pagination/method1?pageNo=1&pageSize=10"

# 第二页
curl "http://localhost:3000/examples/pagination/method1?pageNo=2&pageSize=10"

# 带搜索条件
curl "http://localhost:3000/examples/pagination/search?pageNo=1&pageSize=10&keyword=user1"
```
