import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisModule } from '../../library/redis/redis.module';

export function resolveJwtModuleOptions(configService: ConfigService) {
  const secret = configService.get<string>('jwt.secret');
  if (!secret) {
    throw new Error('jwt.secret is required');
  }

  const expiresIn = Number(configService.get<number>('jwt.expiresIn', 86400));

  return {
    secret,
    signOptions: {
      expiresIn,
    },
  };
}

@Module({
  imports: [
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        resolveJwtModuleOptions(configService),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
