# 分页查询最佳实践 - 使用 PaginationPipe

## 问题

使用自定义查询 DTO 时，需要手动计算 `skip` 和 `take`，代码重复且容易出错。

## 解决方案

使用 `PaginationPipe` 管道自动转换分页参数，让 DTO 自动包含通用的 `skip` 和 `take` 字段。

---

## 核心概念

### PaginationPipe 的作用

`PaginationPipe` 会自动：
1. 读取 `pageNo` 和 `pageSize` 参数
2. 计算分页查询所需的 `skip` 和 `take`
3. 将这些字段添加到 DTO 对象中
4. 保留所有其他查询参数

**转换前：**
```typescript
{
  pageNo: 2,
  pageSize: 10,
  keyword: 'john',
  role: 'admin'
}
```

**转换后：**
```typescript
{
  pageNo: 2,
  pageSize: 10,
  skip: 10,        // 自动计算
  take: 10,        // 自动计算
  keyword: 'john',
  role: 'admin'
}
```

---

## 使用方法

### 步骤 1: 创建查询 DTO（继承 PaginationDto）

```typescript
// user-query.dto.ts
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UserQueryDto extends PaginationDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ 
    description: '角色', 
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

### 步骤 2: 在控制器中使用管道

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { createPaginationResponse } from '../common/dto/pagination.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { UserQueryDto } from './dto/user-query.dto';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiPaginatedResponse(UserDto, { description: '获取用户列表' })
  async getUsers(@Query(PaginationPipe) query: UserQueryDto) {
    // 管道已经自动添加了 skip 和 take 字段
    const { skip, take, pageNo, pageSize, keyword, role, sortBy, sortOrder } = query;

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

    // 构建排序
    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' };

    // 直接使用 skip 和 take，无需手动计算！
    const [users, total] = await Promise.all([
      this.userService.findMany({
        where,
        skip,    // 直接使用
        take,    // 直接使用
        orderBy,
      }),
      this.userService.count({ where }),
    ]);

    // pageNo 和 pageSize 也可以直接使用
    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

### 关键点

1. **在 @Query 装饰器中使用管道**：`@Query(PaginationPipe)`
2. **直接解构 skip 和 take**：无需手动计算
3. **pageNo 和 pageSize 也会被保留**：用于创建响应

---

## 对比：使用管道 vs 不使用管道

### ❌ 不使用管道（需要手动计算）

```typescript
@Get()
async getUsers(@Query() query: UserQueryDto) {
  const { pageNo = 1, pageSize = 10, keyword, role } = query;

  // 😫 需要手动计算
  const skip = (pageNo - 1) * pageSize;
  const take = pageSize;

  const [users, total] = await Promise.all([
    this.userService.findMany({ skip, take }),
    this.userService.count(),
  ]);

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

### ✅ 使用管道（自动计算）

```typescript
@Get()
async getUsers(@Query(PaginationPipe) query: UserQueryDto) {
  // ✨ 管道自动添加了 skip 和 take
  const { skip, take, pageNo, pageSize, keyword, role } = query;

  const [users, total] = await Promise.all([
    this.userService.findMany({ skip, take }),
    this.userService.count(),
  ]);

  return createPaginationResponse(users, total, pageNo, pageSize);
}
```

---

## 完整实战示例

### 场景：用户管理系统

```typescript
// user-query.dto.ts
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

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

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: '排序字段', 
    enum: ['createdAt', 'username', 'email'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'username', 'email'])
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

```typescript
// user.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-response.decorator';
import { createPaginationResponse } from '../common/dto/pagination.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
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
  async getUsers(@Query(PaginationPipe) query: UserQueryDto) {
    // ✨ 管道已经自动添加了 skip、take、pageNo、pageSize
    const {
      skip,
      take,
      pageNo,
      pageSize,
      keyword,
      role,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

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

    // 执行查询 - 直接使用 skip 和 take
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,     // ✨ 直接使用，无需计算
        take,     // ✨ 直接使用，无需计算
        orderBy,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 使用 pageNo 和 pageSize 创建响应
    return createPaginationResponse(users, total, pageNo, pageSize);
  }
}
```

### 请求示例

```bash
# 基础分页
GET /users?pageNo=1&pageSize=10

# 搜索 + 过滤
GET /users?pageNo=1&pageSize=10&keyword=john&role=admin

# 完整查询
GET /users?pageNo=2&pageSize=20&keyword=john&role=admin&status=active&startDate=2024-01-01&endDate=2024-12-31&sortBy=username&sortOrder=asc
```

### 响应示例

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
        "createdAt": "2024-01-15T10:30:00Z"
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

## 优势总结

### ✅ 使用 PaginationPipe 的优势

1. **无需手动计算** - 自动计算 skip 和 take
2. **代码更简洁** - 减少重复代码
3. **类型安全** - DTO 包含所有必要字段
4. **易于维护** - 分页逻辑集中在管道中
5. **保留所有参数** - 其他查询条件不受影响
6. **自动验证** - 结合 class-validator 验证参数

### 📊 代码对比

| 特性 | 不使用管道 | 使用管道 |
|------|-----------|---------|
| 手动计算 skip/take | ✅ 需要 | ❌ 不需要 |
| 代码行数 | 多 3-4 行 | 更少 |
| 出错风险 | 较高 | 较低 |
| 可维护性 | 一般 | 优秀 |
| 代码重复 | 每个接口都要写 | 只写一次 |

---

## 最佳实践

### 1. 始终继承 PaginationDto

```typescript
export class UserQueryDto extends PaginationDto {
  // 其他查询字段
}
```

### 2. 在 @Query 中使用 PaginationPipe

```typescript
async getUsers(@Query(PaginationPipe) query: UserQueryDto) {
  // ...
}
```

### 3. 直接解构所需字段

```typescript
const { skip, take, pageNo, pageSize, keyword, role } = query;
```

### 4. 使用 TypeScript 类型提示

```typescript
// DTO 中已经包含 skip 和 take 的类型定义
export class PaginationDto {
  pageNo?: number;
  pageSize?: number;
  skip?: number;  // 由管道填充
  take?: number;  // 由管道填充
}
```

---

## 注意事项

1. **管道顺序** - PaginationPipe 应该在验证管道之后
2. **默认值** - pageNo 默认为 1，pageSize 默认为 10
3. **最大值限制** - pageSize 最大为 100（在管道中限制）
4. **类型转换** - 管道会自动将字符串转换为数字

---

## 总结

使用 `PaginationPipe` 是处理分页查询的最佳实践：

- ✅ **简单** - 一行代码搞定
- ✅ **自动** - 无需手动计算
- ✅ **安全** - 类型安全和参数验证
- ✅ **灵活** - 支持任意查询条件
- ✅ **优雅** - 代码简洁易读

**推荐用法：**
```typescript
@Get()
async getUsers(@Query(PaginationPipe) query: UserQueryDto) {
  const { skip, take, pageNo, pageSize, ...filters } = query;
  // 直接使用，无需计算！
}
```
