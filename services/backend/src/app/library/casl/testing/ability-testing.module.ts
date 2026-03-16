import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AbilityFactory } from '../ability.factory';
import { UserHook } from '../user.hook';
import { AbilityGuard } from '../guards';
import { PermissionService } from '../../../system/permission/permission.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Ability Testing Module
 * 用于测试的 CASL 模块，提供测试工具和模拟服务
 */
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 1800000,
    }),
    PrismaModule,
  ],
  providers: [AbilityFactory, UserHook, AbilityGuard, PermissionService],
  exports: [AbilityFactory, UserHook, AbilityGuard, PermissionService],
})
export class AbilityTestingModule {}
