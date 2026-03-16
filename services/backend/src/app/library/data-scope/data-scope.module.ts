import { Module, Global } from '@nestjs/common';
import { DataScopeService } from './data-scope.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

/**
 * 数据范围模块
 * 提供数据权限过滤功能
 */
@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  providers: [DataScopeService],
  exports: [DataScopeService],
})
export class DataScopeModule {}
