# Swagger 集成指南

本文档介绍如何在项目中使用 Swagger 自动生成 API 文档，以及如何使用自定义装饰器来定义统一响应格式。

## 访问 Swagger 文档

启动应用后，访问：
```
http://localhost:3000/api-docs
```

## 自定义响应装饰器

我们提供了三个自定义装饰器来定义 API 响应格式：

### 1. @ApiSuccessResponse

用于定义成功响应，自动包装实体类为统一响应格式。

**基本用法：**

```typescript
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';
import { UserDto } from './dto/user.dto';

@Get('user')
@ApiSuccessResponse(UserDto, { description: '获取用户成功' })
getUser() {
  return { id: 1, username: 'john', email: 'john@example.com' };
}
```

**生成的 Swagger 响应格式：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  },
  "message": "success",
  "success": true
}
```

**返回数组：**

```typescript
@Get('users')
@ApiSuccessResponse(UserDto, { 
  description: '获取用户列表', 
  isArray: true 
})
getUsers() {
  return [
    { id: 1, username: 'john', email: 'john@example.com' },
    { id: 2, username: 'jane', email: 'jane@example.com' }
  ];
}
```

**生成的 Swagger 响应格式：**
```json
{
  "code": 200,
  "data": [
    { "id": 1, "username": "john", "email": "john@example.com" },
    { "id": 2, "username": "jane", "email": "jane@example.com" }
  ],
  "message": "success",
  "success": true
}
```

### 2. @ApiErrorResponse

用于定义错误响应。

**基本用法：**

```typescript
import { ApiErrorResponse } from '../common/decorators/api-response.decorator';

@Get('user/:id')
@ApiSuccessResponse(UserDto)
@ApiErrorResponse({ status: 404, message: 'User not found' })
@ApiErrorResponse({ status: 400, message: 'Invalid user ID' })
getUser(@Param('id') id: string) {
  // ...
}
```

**生成的 Swagger 错误响应格式：**
```json
{
  "code": 404,
  "data": null,
  "message": "User not found",
  "success": false
}
```

**自定义业务状态码：**

```typescript
@Get('user/:id')
@ApiErrorResponse({ 
  status: 200,  // HTTP 状态码
  code: 1001,   // 业务状态码
  message: 'User not found' 
})
getUser(@Param('id') id: string) {
  throw new BusinessException(1001, 'User not found');
}
```

### 3. @ApiStandardResponse

组合装饰器，同时定义成功响应和常见错误响应（400、401、403、404、500）。

**基本用法：**

```typescript
import { ApiStandardResponse } from '../common/decorators/api-response.decorator';

@Get('user/:id')
@ApiStandardResponse(UserDto, { description: '获取用户信息' })
getUser(@Param('id') id: string) {
  // ...
}
```

这相当于：
```typescript
@ApiSuccessResponse(UserDto, { description: '获取用户信息' })
@ApiErrorResponse({ status: 400, message: 'Bad Request' })
@ApiErrorResponse({ status: 401, message: 'Unauthorized' })
@ApiErrorResponse({ status: 403, message: 'Forbidden' })
@ApiErrorResponse({ status: 404, message: 'Not Found' })
@ApiErrorResponse({ status: 500, message: 'Internal Server Error' })
```

## 创建 DTO

使用 `@ApiProperty` 装饰器定义 DTO 属性：

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ 
    description: '用户ID', 
    example: 1 
  })
  id: number;

  @ApiProperty({ 
    description: '用户名', 
    example: 'john_doe',
    minLength: 3,
    maxLength: 50
  })
  username: string;

  @ApiProperty({ 
    description: '邮箱', 
    example: 'john@example.com' 
  })
  email: string;

  @ApiProperty({ 
    description: '角色', 
    example: 'user',
    enum: ['user', 'admin', 'moderator']
  })
  role: string;
}
```

## 完整示例

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { 
  ApiSuccessResponse, 
  ApiErrorResponse,
  ApiStandardResponse 
} from '../common/decorators/api-response.decorator';
import { UserDto, CreateUserDto } from './dto/user.dto';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  // 获取用户列表
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiSuccessResponse(UserDto, { 
    description: '成功获取用户列表', 
    isArray: true 
  })
  @ApiErrorResponse({ status: 401, message: 'Unauthorized' })
  async getUsers() {
    return [
      { id: 1, username: 'john', email: 'john@example.com', role: 'user' },
      { id: 2, username: 'jane', email: 'jane@example.com', role: 'admin' }
    ];
  }

  // 获取单个用户
  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiStandardResponse(UserDto, { description: '成功获取用户信息' })
  async getUser(@Param('id') id: string) {
    return { id: 1, username: 'john', email: 'john@example.com', role: 'user' };
  }

  // 创建用户
  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiSuccessResponse(UserDto, { description: '用户创建成功' })
  @ApiErrorResponse({ status: 400, message: '用户名已存在' })
  @ApiErrorResponse({ status: 401, message: 'Unauthorized' })
  async createUser(@Body() dto: CreateUserDto) {
    return { id: 1, ...dto, role: 'user' };
  }
}
```

## 使用 @ResponseMessage 和 @ResponseCode

如果需要自定义响应消息和状态码，可以结合使用：

```typescript
import { ResponseMessage, ResponseCode } from '../common/decorators/response.decorator';

@Get('custom')
@ApiOperation({ summary: '自定义响应' })
@ResponseMessage('操作成功')
@ResponseCode(200)
@ApiSuccessResponse(UserDto)
getCustom() {
  return { id: 1, username: 'john', email: 'john@example.com' };
}
```

**实际响应：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  },
  "message": "操作成功",
  "success": true
}
```

## 认证相关

对于需要认证的接口，使用 `@ApiBearerAuth` 装饰器：

```typescript
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@Get('profile')
@ApiOperation({ summary: '获取当前用户信息' })
@ApiSuccessResponse(UserDto)
async getProfile(@Request() req) {
  return req.user;
}
```

对于公开接口，使用 `@Public()` 装饰器：

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Post('login')
@ApiOperation({ summary: '用户登录' })
@ApiSuccessResponse(AuthResponseDto)
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

## 标签和分组

使用 `@ApiTags` 对接口进行分组：

```typescript
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  // ...
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  // ...
}
```

## 最佳实践

1. **始终使用 DTO**
   - 为每个请求和响应创建 DTO
   - 使用 `@ApiProperty` 详细描述每个字段

2. **使用自定义装饰器**
   - 使用 `@ApiSuccessResponse` 而不是原生的 `@ApiResponse`
   - 这样可以自动生成统一响应格式的文档

3. **完整的错误响应**
   - 为每个接口定义可能的错误响应
   - 使用 `@ApiStandardResponse` 快速添加常见错误

4. **清晰的描述**
   - 使用 `@ApiOperation` 提供清晰的接口说明
   - 在 DTO 中提供详细的字段描述和示例

5. **分组和标签**
   - 使用 `@ApiTags` 对相关接口进行分组
   - 保持标签名称一致和有意义

## 示例端点

查看以下控制器获取完整示例：
- `src/examples/response-example.controller.ts` - 响应格式示例
- `src/auth/auth.controller.ts` - 认证接口示例

访问 Swagger 文档查看实际效果：
```
http://localhost:3000/api-docs
```
