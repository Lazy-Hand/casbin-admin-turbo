import { Module } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { OperationLogController, LoginLogController } from './operation-log.controller';
import { RedisModule } from '@/app/library/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [OperationLogController, LoginLogController],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
