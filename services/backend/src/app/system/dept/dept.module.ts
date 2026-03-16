import { Module } from '@nestjs/common';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { PrismaModule } from '@/app/library/prisma/prisma.module';
import { RedisModule } from '@/app/library/redis/redis.module';
import { DataScopeModule } from '@/app/library/data-scope/data-scope.module';

@Module({
  imports: [PrismaModule, RedisModule, DataScopeModule],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
