import { Global, Module } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { PrismaService } from 'nestjs-prisma';
import { PrismaClient } from '@prisma/client';
import { PrismaCoreModule, APP_PRISMA } from './prisma-core.module';

@Global()
@Module({
  imports: [PrismaCoreModule],
  providers: [
    {
      provide: PrismaService,
      useFactory: (customPrisma: CustomPrismaService<PrismaClient>) =>
        customPrisma.client,
      inject: [APP_PRISMA],
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
