import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Duplex } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'nestjs-prisma';
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

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    permission: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timer: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    operationLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    loginLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
    },
    dept: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      create: jest.fn(),
    },
    post: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    sysConfig: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sysFile: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dictType: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dictItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    timerExecutionLog: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback?: (tx: typeof prismaMock) => unknown) =>
      callback ? callback(prismaMock as typeof prismaMock) : undefined,
    ),
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
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
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
