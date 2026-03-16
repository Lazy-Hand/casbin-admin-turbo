# 统一响应格式处理系统

本文档介绍如何使用 NestJS 统一响应格式处理系统，包括 Transform Interceptor 和 Exception Filter。

## 概述

该系统自动将所有 API 响应转换为统一格式：

**成功响应：**
```json
{
  "code": 200,
  "data": { ... },
  "message": "success",
  "success": true
}
```

**错误响应：**
```json
{
  "code": 400,
  "data": null,
  "message": "Error message",
  "success": false
}
```

## 核心组件

### 1. IResponse 接口

定义统一响应格式的接口：

```typescript
export interface IResponse<T = any> {
  code: number;           // 业务状态码
  data: T;                // 响应数据
  message: string;        // 响应消息
  success: boolean;       // 是否成功
}
```

### 2. TransformInterceptor

自动包装所有成功的控制器响应。

### 3. HttpExceptionFilter

捕获并转换所有异常为统一格式。

### 4. BusinessException

自定义业务异常类，支持自定义业务状态码。

## 使用方法

### 基本使用

控制器直接返回数据，拦截器会自动包装：

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return { id, name: 'John Doe' };
  }
  // 响应: { code: 200, data: { id: '1', name: 'John Doe' }, message: 'success', success: true }
}
```

### 使用自定义装饰器

使用 `@ResponseMessage` 和 `@ResponseCode` 装饰器自定义响应：

```typescript
import { ResponseMessage, ResponseCode } from '../common/decorators/response.decorator';

@Controller('users')
export class UserController {
  @Get()
  @ResponseMessage('Users retrieved successfully')
  @ResponseCode(200)
  async getUsers() {
    return [{ id: 1, name: 'John' }];
  }
  // 响应: { code: 200, data: [...], message: 'Users retrieved successfully', success: true }
}
```

### 手动返回统一格式

如果需要完全控制响应，可以手动返回统一格式：

```typescript
@Controller('users')
export class UserController {
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    
    return {
      code: 201,
      data: user,
      message: 'User created successfully',
      success: true,
    };
  }
}
```

### 抛出业务异常

使用 `BusinessException` 抛出自定义业务异常：

```typescript
import { BusinessException } from '../common/exceptions/business.exception';

@Controller('users')
export class UserController {
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    
    if (!user) {
      throw new BusinessException(1001, 'User not found');
    }
    
    if (user.role === 'admin') {
      throw new BusinessException(1002, 'Cannot delete admin user');
    }
    
    await this.userService.delete(id);
    return { deleted: true };
  }
}
```

**响应示例：**
```json
{
  "code": 1001,
  "data": null,
  "message": "User not found",
  "success": false
}
```

### 抛出 HTTP 异常

标准的 NestJS HTTP 异常也会被自动转换：

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }
    
    const user = await this.userService.findOne(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }
}
```

**响应示例：**
```json
{
  "code": 400,
  "data": null,
  "message": "User ID is required",
  "success": false
}
```

## 异常处理优先级

系统按以下优先级处理异常：

1. **BusinessException** - 使用自定义业务状态码
2. **HttpException** - 使用 HTTP 状态码作为业务状态码
3. **未知异常** - 统一返回 500

## 数据类型支持

系统支持所有 JavaScript 数据类型：

### 对象
```typescript
return { id: 1, name: 'John' };
// { code: 200, data: { id: 1, name: 'John' }, message: 'success', success: true }
```

### 数组
```typescript
return [{ id: 1 }, { id: 2 }];
// { code: 200, data: [{ id: 1 }, { id: 2 }], message: 'success', success: true }
```

### 原始类型
```typescript
return 'Hello World';
// { code: 200, data: 'Hello World', message: 'success', success: true }
```

### 空值
```typescript
return null;
// { code: 200, data: null, message: 'success', success: true }
```

## 全局配置

系统已在 `AppModule` 中全局注册：

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## 测试端点

系统提供了示例控制器用于测试各种场景：

- `GET /examples/response/object` - 返回对象
- `GET /examples/response/array` - 返回数组
- `GET /examples/response/string` - 返回字符串
- `GET /examples/response/null` - 返回 null
- `GET /examples/response/custom` - 使用自定义装饰器
- `POST /examples/response/manual` - 手动返回统一格式
- `GET /examples/response/business-error` - 抛出业务异常
- `GET /examples/response/http-error` - 抛出 HTTP 异常
- `GET /examples/response/not-found` - 抛出 404 异常
- `GET /examples/response/unknown-error` - 抛出未知异常

## 最佳实践

1. **使用 BusinessException 处理业务逻辑错误**
   - 为不同的业务错误定义唯一的状态码
   - 提供清晰的错误消息

2. **使用 HTTP 异常处理 HTTP 层错误**
   - 使用标准的 NestJS HTTP 异常（BadRequestException、NotFoundException 等）

3. **使用装饰器自定义成功响应**
   - 为重要的操作提供有意义的消息
   - 使用适当的状态码（如 201 表示创建成功）

4. **避免双重包装**
   - 如果已经返回统一格式，拦截器会自动识别并跳过包装

5. **保持一致性**
   - 在整个应用中使用统一的错误码规范
   - 为前端提供错误码文档

## 错误码规范建议

建议为不同的业务模块定义错误码范围：

- `1000-1999`: 用户相关错误
- `2000-2999`: 订单相关错误
- `3000-3999`: 支付相关错误
- `4000-4999`: 产品相关错误
- `5000-5999`: 系统相关错误

示例：
```typescript
// 用户模块错误码
export enum UserErrorCode {
  USER_NOT_FOUND = 1001,
  USER_ALREADY_EXISTS = 1002,
  INVALID_PASSWORD = 1003,
  ACCOUNT_LOCKED = 1004,
}

// 使用
throw new BusinessException(UserErrorCode.USER_NOT_FOUND, 'User not found');
```

## 注意事项

1. **HTTP 状态码与业务状态码分离**
   - HTTP 状态码用于 HTTP 层（200、400、500 等）
   - 业务状态码用于业务逻辑（1001、1002 等）

2. **BusinessException 默认 HTTP 状态码为 200**
   - 业务异常不一定是 HTTP 错误
   - 可以通过第三个参数自定义 HTTP 状态码

3. **异常过滤器顺序**
   - HttpExceptionFilter 应该在其他过滤器之前注册
   - 确保能够捕获所有类型的异常

4. **依赖注入**
   - TransformInterceptor 需要 Reflector 依赖
   - 使用 AppModule 注册以支持依赖注入
