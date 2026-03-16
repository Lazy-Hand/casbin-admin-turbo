# 分页查询结合其他查询条件

本文档说明如何在使用分页功能的同时处理其他查询条件。

## 问题

使用 `@Pagination` 装饰器后，如何同时处理其他查询条件（如搜索、过滤、排序等）？

## 解决方案

有三种推荐的方法：

---

## 方法 1: 结合 @Query 装饰器（简单场景）

适用于查询条件较少的场景。

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { Pagination } from '../common/decorators/pagination.decorator';
import { ApiQuery, ApiPaginatedResponse } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  @Get()
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiPaginatedResponse(UserDto)
  async getUsers(
    @Pagination() pagination: { skip: number; take: number },
    @Query('keyword') keyword?: string,
    @Query('role') role?: string,
  ) {
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

    // 使用分页参数查询
    const [users, total] = await Promise.all([
      this.userService.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.userService.count({ where }),
    ]);

    const pageNo = Math.floor(pagination.skip / pagination.take) + 1;
    const pageSize = pagination.take;

    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

**请求示例：**
```bash
GET /users?pageNo=1&pageSize=10&keyword=john&role=admin
```

**优点：**
- 简单直接
- 适合查询条件少的场景

**缺点：**
- 查询条件多时代码冗长
- 缺少参数验证

---

## 方法 2: 使用自定义查询 DTO（推荐）

适用于查询条件较多的场景，提供完整的参数验证。

### 步骤 1: 创建查询 DTO

```typescript
// user-query.dto.ts
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UserQueryDto extends PaginationDto {
  @ApiProperty({
    description: '搜索关键词',
    required: false,
    example: 'john',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '角色过滤',
    enum: ['user', 'admin', 'moderator'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['user', 'admin', 'moderator'])
  role?: string;

  @ApiProperty({
    description: '状态过滤',
    enum: ['active', 'inactive', 'banned'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'])
  status?: string;

  @ApiProperty({
    description: '排序字段',
    enum: ['createdAt', 'username', 'email'],
    required: false,
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'username', 'email'])
  sortBy?: string;

  @ApiProperty({
    description: '排序方向',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
```

### 步骤 2: 在控制器中使用

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { createPaginationResponse } from '../common/dto/pagination.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiPaginatedResponse(UserDto, { description: '获取用户列表' })
  async getUsers(@Query() query: UserQueryDto) {
    // 解构查询参数
    const {
      pageNo = 1,
      pageSize = 10,
      keyword,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // 计算分页参数
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const where: any = {};
    
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    // 构建排序
    const orderBy = { [sortBy]: sortOrder };

    // 执行查询
    const [users, total] = await Promise.all([
      this.userService.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.userService.count({ where }),
    ]);

    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

**请求示例：**
```bash
GET /users?pageNo=1&pageSize=10&keyword=john&role=admin&status=active&sortBy=username&sortOrder=asc
```

**优点：**
- 完整的参数验证
- 类型安全
- Swagger 自动生成文档
- 代码清晰易维护

**缺点：**
- 需要创建额外的 DTO 类

---

## 方法 3: 混合使用（灵活场景）

结合 `@Pagination` 装饰器和自定义 DTO。

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { Pagination } from '../common/decorators/pagination.decorator';

// 创建不包含分页字段的过滤 DTO
export class UserFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}

@Controller('users')
export class UserController {
  @Get()
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiPaginatedResponse(UserDto)
  async getUsers(
    @Pagination() pagination: { skip: number; take: number },
    @Query() filters: UserFilterDto,
  ) {
    const { keyword, role } = filters;

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
}
```

**优点：**
- 分离分页和过滤逻辑
- 灵活性高

**缺点：**
- 需要手动添加 @ApiQuery 装饰器

---

## 完整实战示例

### 场景：用户管理列表

需求：
- 分页查询
- 关键词搜索（用户名、邮箱）
- 角色过滤
- 状态过滤
- 日期范围过滤
- 排序

### 1. 创建查询 DTO

```typescript
// user-query.dto.ts
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto extends PaginationDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ 
    description: '角色', 
    enum: ['user', 'admin', 'moderator'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['user', 'admin', 'moderator'])
  role?: string;

  @ApiProperty({ 
    description: '状态', 
    enum: ['active', 'inactive', 'banned'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'banned'])
  status?: string;

  @ApiProperty({ description: '开始日期', required: false, example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: '排序字段', 
    enum: ['createdAt', 'username', 'email', 'lastLoginAt'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'username', 'email', 'lastLoginAt'])
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

### 2. 实现控制器

```typescript
// user.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { createPaginationResponse } from '../common/dto/pagination.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from '../user/user.service';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiPaginatedResponse(UserDto, { description: '成功获取用户列表' })
  async getUsers(@Query() query: UserQueryDto) {
    const {
      pageNo = 1,
      pageSize = 10,
      keyword,
      role,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // 计算分页参数
    const skip = (pageNo - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 角色过滤
    if (role) {
      where.role = role;
    }

    // 状态过滤
    if (status) {
      where.status = status;
    }

    // 日期范围过滤
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 构建排序
    const orderBy = { [sortBy]: sortOrder };

    // 执行查询
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

### 3. 请求示例

```bash
# 基础分页
GET /users?pageNo=1&pageSize=10

# 搜索用户
GET /users?pageNo=1&pageSize=10&keyword=john

# 过滤管理员
GET /users?pageNo=1&pageSize=10&role=admin

# 过滤活跃用户
GET /users?pageNo=1&pageSize=10&status=active

# 日期范围查询
GET /users?pageNo=1&pageSize=10&startDate=2024-01-01&endDate=2024-12-31

# 组合查询
GET /users?pageNo=1&pageSize=10&keyword=john&role=admin&status=active&sortBy=username&sortOrder=asc

# 完整查询
GET /users?pageNo=2&pageSize=20&keyword=john&role=admin&status=active&startDate=2024-01-01&endDate=2024-12-31&sortBy=createdAt&sortOrder=desc
```

### 4. 响应示例

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLoginAt": "2024-02-04T08:00:00Z"
      }
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

---

## 最佳实践

### 1. 使用继承 PaginationDto 的自定义 DTO

✅ **推荐：**
```typescript
export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
```

❌ **不推荐：**
```typescript
export class UserQueryDto {
  pageNo?: number;
  pageSize?: number;
  keyword?: string;
}
```

### 2. 提供默认值

```typescript
const {
  pageNo = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = query;
```

### 3. 使用数据库查询的大小写不敏感能力进行搜索

```typescript
where.username = { contains: keyword, mode: 'insensitive' };
```

### 4. 使用 Promise.all 并行查询

```typescript
const [users, total] = await Promise.all([
  this.prisma.user.findMany({ where, skip, take }),
  this.prisma.user.count({ where }),
]);
```

### 5. 添加数据库索引

为常用的查询和排序字段添加索引：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  role      String   @default("user")
  status    String   @default("active")
  createdAt DateTime @default(now())

  @@index([role])
  @@index([status])
  @@index([createdAt])
  @@index([role, status])
}
```

---

## 总结

| 方法 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| @Query 装饰器 | 查询条件少（1-3个） | 简单直接 | 缺少验证，代码冗长 |
| 自定义 DTO（推荐） | 查询条件多（3个以上） | 完整验证，类型安全，易维护 | 需要创建 DTO 类 |
| 混合使用 | 灵活场景 | 分离关注点 | 需要手动配置 Swagger |

**推荐使用方法 2（自定义 DTO）**，它提供了最好的类型安全、参数验证和代码可维护性。
