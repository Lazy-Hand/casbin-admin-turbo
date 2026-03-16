import { ConfigService } from '@nestjs/config';
import { resolveJwtModuleOptions } from './auth.module';

describe('resolveJwtModuleOptions', () => {
  it('throws when jwt secret is missing', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return undefined;
        if (key === 'jwt.expiresIn') return 3600;
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(() => resolveJwtModuleOptions(configService)).toThrow(
      'jwt.secret is required',
    );
  });

  it('builds options from config values', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'super-secret';
        if (key === 'jwt.expiresIn') return 7200;
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(resolveJwtModuleOptions(configService)).toEqual({
      secret: 'super-secret',
      signOptions: {
        expiresIn: 7200,
      },
    });
  });
});
