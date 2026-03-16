import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { AppModule } from './app.module';
import { AbilityGuard } from './app/library/casl/guards';
import { JwtAuthGuard } from './app/system/auth/guards/jwt-auth.guard';

describe('AppModule guards', () => {
  it('registers JWT and ability guards globally in order', () => {
    const providers =
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) ?? [];

    const guardProviders = providers.filter(
      (provider: { provide?: unknown }) => provider?.provide === APP_GUARD,
    );

    expect(guardProviders).toHaveLength(2);
    expect(guardProviders[0].useClass).toBe(JwtAuthGuard);
    expect(guardProviders[1].useClass).toBe(AbilityGuard);
  });
});
