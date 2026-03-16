import { Module, Global, OnModuleInit } from '@nestjs/common';
import { AbilityFactory } from './ability.factory';
import { UserHook } from './user.hook';
import { AbilityGuard } from './guards';
import { PermissionModule } from '../../system/permission/permission.module';
import { PermissionService } from '../../system/permission/permission.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CASL Module
 * 全局模块，提供权限控制相关的服务和守卫
 *
 * 导出的服务：
 * - AbilityFactory: 创建 Ability 实例
 * - UserHook: 加载用户完整权限信息
 * - AbilityGuard: 权限守卫
 *
 * 使用方式：
 * 1. 在 AppModule 中导入 CaslModule
 * 2. 在控制器中使用 @UseGuards(AbilityGuard)
 * 3. 使用权限装饰器标记端点：@Can('read', 'Article')
 */
@Global()
@Module({
  imports: [PrismaModule, PermissionModule],
  providers: [AbilityFactory, UserHook, AbilityGuard],
  exports: [AbilityFactory, UserHook, AbilityGuard],
})
export class CaslModule implements OnModuleInit {
  constructor(private permissionService: PermissionService) {}

  /**
   * 模块初始化时预加载权限配置
   */
  async onModuleInit() {
    await this.permissionService.preloadPermissions();
  }
}
