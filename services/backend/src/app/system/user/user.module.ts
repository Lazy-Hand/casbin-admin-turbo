import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { PrismaModule } from '@/app/library/prisma/prisma.module';
import { DataScopeModule } from '@/app/library/data-scope/data-scope.module';

@Module({
  imports: [PrismaModule, DataScopeModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
