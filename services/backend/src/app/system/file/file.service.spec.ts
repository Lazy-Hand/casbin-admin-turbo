import { BadRequestException } from '@nestjs/common';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { FileService } from './file.service';

describe('FileService upload path validation', () => {
  const prismaMock = {
    sysFile: {
      create: jest.fn(),
    },
  };
  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'upload.dir') return 'uploads';
      if (key === 'upload.chunkDir') return 'uploads/chunks';
      if (key === 'upload.prefix') return '/uploads';
      return undefined;
    }),
  };

  afterEach(() => {
    const leakedDir = join(process.cwd(), 'uploads', 'bad-upload-id');
    if (existsSync(leakedDir)) {
      rmSync(leakedDir, { recursive: true, force: true });
    }
  });

  it('rejects upload ids containing path separators', async () => {
    const service = new FileService(
      prismaMock as never,
      configServiceMock as never,
    );

    await expect(
      service.saveChunk(
        {
          buffer: Buffer.from('chunk'),
        } as Express.Multer.File,
        '../bad-upload-id',
        0,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
