import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { AbilityFactory } from '../ability.factory';
import { UserHook } from '../user.hook';
import { AbilityGuard } from '../guards';
import { PermissionService } from '../../../system/permission/permission.service';
import { DrizzleService } from '../../drizzle';

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
  ],
  providers: [
    AbilityFactory,
    UserHook,
    AbilityGuard,
    PermissionService,
    {
      provide: DrizzleService,
      useValue: {
        db: {
          select: jest.fn(),
        },
      },
    },
    {
      provide: ConfigService,
      useValue: {
        get: jest.fn().mockImplementation((_: string, fallback: unknown) => fallback),
      },
    },
  ],
  exports: [AbilityFactory, UserHook, AbilityGuard, PermissionService],
})
export class AbilityTestingModule {}
