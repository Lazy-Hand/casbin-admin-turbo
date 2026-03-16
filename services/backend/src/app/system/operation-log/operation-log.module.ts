import { Module } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { OperationLogController, LoginLogController } from './operation-log.controller';
import { PrismaModule } from '@/app/library/prisma/prisma.module';
import { RedisModule } from '@/app/library/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [OperationLogController, LoginLogController],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
