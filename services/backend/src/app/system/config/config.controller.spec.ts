import { BadRequestException } from '@nestjs/common';
import { ConfigController } from './config.controller';

describe('ConfigController getByKeys', () => {
  it('rejects missing keys', async () => {
    const controller = new ConfigController({
      getByKeys: jest.fn(),
    } as never);

    await expect(controller.getByKeys(undefined as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
