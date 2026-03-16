import { Module } from '@nestjs/common';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { DataScopeModule } from '@/app/library/data-scope/data-scope.module';

@Module({
  imports: [DataScopeModule],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
