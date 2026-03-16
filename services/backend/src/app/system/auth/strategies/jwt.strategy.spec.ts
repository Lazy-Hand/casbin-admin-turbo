import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy secret handling', () => {
  it('throws when jwt secret is missing', () => {
    const configService = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const authService = {
      validateAccessToken: jest.fn(),
    };

    expect(() => new JwtStrategy(configService, authService as never)).toThrow(
      'jwt.secret is required',
    );
  });
});
