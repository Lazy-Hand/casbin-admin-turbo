import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DrizzleModule } from './app/library/drizzle';
import { RedisModule } from '@/app/library/redis';
import { AuthModule } from './app/system/auth/auth.module';
import { CaslModule, CaslExceptionFilter } from './app/library/casl';
import { AbilityGuard } from '@/app/library/casl';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './app/system/auth/guards/jwt-auth.guard';
import { createWinstonConfig } from './app/library/logger/winston.config';
import { RoleModule } from './app/system/role/role.module';
import { UserModule } from './app/system/user/user.module';
import { FileModule } from './app/system/file/file.module';
import { TimerModule } from './app/system/timer/timer.module';
import { DictModule } from './app/system/dict/dict.module';
import { OperationLogModule } from './app/system/operation-log/operation-log.module';
import { DeptModule } from './app/system/dept/dept.module';
import { PostModule } from './app/system/post/post.module';
import { ConfigModule as SysConfigModule } from './app/system/config/config.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { OperationLogService } from './app/system/operation-log/operation-log.service';
import { DataScopeModule } from './app/library/data-scope/data-scope.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createWinstonConfig(configService),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('casl.cache.ttl', 1800000),
        max: configService.get<number>('casl.cache.max', 1000),
      }),
    }),
    DrizzleModule,
    RedisModule,
    DataScopeModule,
    AuthModule,
    CaslModule,
    RoleModule,
    UserModule,
    FileModule,
    TimerModule,
    DictModule,
    DeptModule,
    PostModule,
    SysConfigModule,
    OperationLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AbilityGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (operationLogService: OperationLogService) => {
        return new OperationLogInterceptor(operationLogService);
      },
      inject: [OperationLogService],
    },
    {
      provide: APP_FILTER,
      useClass: CaslExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
