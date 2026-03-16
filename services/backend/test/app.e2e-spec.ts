import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Duplex } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './../src/app.module';
import { DrizzleService } from './../src/app/library/drizzle';
import { RedisService } from './../src/app/library/redis/redis.service';
import { PermissionService } from './../src/app/system/permission/permission.service';
import { TimerService } from './../src/app/system/timer/timer.service';

class MockSocket extends Duplex {
  remoteAddress = '127.0.0.1';

  _read() {
    this.push(null);
  }

  _write(
    _chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    callback();
  }

  setTimeout() {}

  destroy() {}

  cork() {}

  uncork() {}
}

async function dispatchHttpGet(
  app: INestApplication,
  path: string,
): Promise<{ statusCode: number; body: string }> {
  const adapter = app.getHttpAdapter();
  const handler = adapter.getInstance() as (
    req: IncomingMessage,
    res: ServerResponse,
  ) => void;

  const socket = new MockSocket();
  const req = new IncomingMessage(socket);
  req.method = 'GET';
  req.url = path;
  req.originalUrl = path;
  req.headers = {};
  req.httpVersion = '1.1';
  req.socket = socket;
  req.connection = socket;

  const res = new ServerResponse(req);
  let raw = '';

  await new Promise<void>((resolve, reject) => {
    socket.write = (
      chunk: Uint8Array | string,
      _encoding?: BufferEncoding,
      callback?: (error?: Error | null) => void,
    ) => {
      raw += chunk.toString();
      callback?.();
      return true;
    };

    res.assignSocket(socket);
    res.on('finish', () => resolve());
    res.on('error', reject);

    try {
      handler(req, res);
    } catch (error) {
      reject(error);
    }
  });

  const [, body = ''] = raw.split('\r\n\r\n');
  return {
    statusCode: res.statusCode,
    body,
  };
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const drizzleMock = {
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      transaction: jest.fn(),
    },
    findMany: jest.fn(),
    findFirst: jest.fn(),
    insertWithAudit: jest.fn(),
    updateWithAudit: jest.fn(),
    softDeleteWhere: jest.fn(),
  };

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    mget: jest.fn(),
    lpush: jest.fn(),
    lrange: jest.fn().mockResolvedValue([]),
    drainList: jest.fn().mockResolvedValue([]),
    ltrim: jest.fn(),
    getClient: jest.fn(() => ({
      pipeline: jest.fn(() => ({
        setex: jest.fn(),
        exec: jest.fn(),
      })),
    })),
  };

  const permissionServiceMock = {
    preloadPermissions: jest.fn(),
    getUserPermissions: jest.fn().mockResolvedValue([]),
  };

  const timerServiceMock = {
    onModuleInit: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DrizzleService)
      .useValue(drizzleMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideProvider(PermissionService)
      .useValue(permissionServiceMock)
      .overrideProvider(TimerService)
      .useValue(timerServiceMock)
      .compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns hello world from the public root endpoint', async () => {
    const response = await dispatchHttpGet(app, '/');

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      code: 200,
      data: 'Hello World!',
      message: 'success',
      success: true,
    });
  });
});
