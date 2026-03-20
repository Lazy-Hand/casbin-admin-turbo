import { Controller, Post, Body, Get, Request as NestRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { RoutePermissionTreeNodeDto } from './dto/route-permission.dto';
import { Public } from './decorators/public.decorator';
import { ApiSuccessResponse, ApiErrorResponse } from '@/common/decorators/api-response.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { RequestUser } from '@/common/types/user.types';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiSuccessResponse(AuthResponseDto, { description: '注册成功' })
  @ApiErrorResponse({ status: 400, message: '用户名已存在' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiSuccessResponse(AuthResponseDto, { description: '登录成功' })
  @ApiErrorResponse({ status: 401, message: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto, @NestRequest() req: Request) {
    const xForwardedFor = req.headers?.['x-forwarded-for'];
    const firstIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    const ip =
      req.ip ||
      firstIp?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';
    const userAgent = Array.isArray(req.headers?.['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers?.['user-agent'] || '';
    return this.authService.login(loginDto, { ip, userAgent });
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiSuccessResponse(UserProfileDto, { description: '获取用户信息成功' })
  @ApiErrorResponse({ status: 401, message: 'Unauthorized' })
  async getProfile(@NestRequest() req: Request & { user: RequestUser }) {
    return this.authService.getProfile(req.user);
  }

  @Get('route-permissions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取当前用户路由权限',
    description:
      '根据当前用户关联的角色，查询 resourceType=menu 和 button 的权限，返回扁平数组（按钮权限聚合到对应菜单的 buttons 字段）',
  })
  @ApiSuccessResponse(RoutePermissionTreeNodeDto, {
    description: '路由权限列表（扁平结构）',
    isArray: true,
  })
  @ApiErrorResponse({ status: 401, message: 'Unauthorized' })
  async getRoutePermissions(@CurrentUser() user: { id: number }) {
    return this.authService.getRoutePermissions(user.id);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '用户登出',
    description: '登出后会清除 Redis 中的会话状态和用户缓存，token 将失效',
  })
  @ApiErrorResponse({ status: 401, message: 'Unauthorized' })
  async logout(@CurrentUser() user: RequestUser) {
    await this.authService.logout(user);
    return { message: '登出成功' };
  }
}
