import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PrismaModule } from '../../library/prisma/prisma.module';
import { DataScopeModule } from '../../library/data-scope/data-scope.module';

@Module({
  imports: [PrismaModule, DataScopeModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
