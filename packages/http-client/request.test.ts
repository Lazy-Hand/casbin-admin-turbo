import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { HttpClientError, createRequest } from './request.js';

function createConfig(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return {
    headers: {},
    method: 'get',
    url: '/test',
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function createResponse<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200,
): AxiosResponse<T> {
  return {
    config,
    data,
    headers: {},
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
  };
}

test('business methods unwrap the shared response payload', async () => {
  const request = createRequest({
    adapter: async (config) =>
      createResponse(config, {
        code: 200,
        data: { id: 1, name: 'demo' },
        message: 'ok',
      }),
  });

  const response = await request.get<{ id: number; name: string }>('/users');

  assert.equal(response.code, 200);
  assert.deepEqual(response.data, { id: 1, name: 'demo' });
});

test('raw methods keep the original axios response shape', async () => {
  const request = createRequest({
    adapter: async (config) =>
      createResponse(config, {
        code: 200,
        data: { id: 2 },
        message: 'ok',
      }),
  });

  const response = await request.rawGet('/users');

  assert.equal(response.status, 200);
  assert.deepEqual(response.data, {
    code: 200,
    data: { id: 2 },
    message: 'ok',
  });
});

test('business failure rejects with HttpClientError', async () => {
  const request = createRequest({
    adapter: async (config) =>
      createResponse(config, {
        code: 50001,
        data: null,
        message: 'denied',
      }),
  });

  await assert.rejects(
    () => request.get('/users'),
    (error: unknown) => {
      assert.equal(error instanceof HttpClientError, true);
      assert.equal((error as HttpClientError).kind, 'business');
      assert.equal((error as HttpClientError).businessCode, 50001);
      return true;
    },
  );
});

test('retry retries GET requests on 5xx by default', async () => {
  let attempts = 0;

  const adapter: AxiosAdapter = async (config) => {
    attempts += 1;

    if (attempts === 1) {
      const response = createResponse(
        config,
        {
          message: 'temporary error',
        },
        503,
      );
      throw new AxiosError('temporary error', 'ERR_BAD_RESPONSE', config, undefined, response);
    }

    return createResponse(config, {
      code: 200,
      data: { success: true },
      message: 'ok',
    });
  };

  const request = createRequest({
    adapter,
    enableRetry: true,
    retryCount: 1,
    retryDelay: 0,
  });

  const response = await request.get<{ success: boolean }>('/retry');

  assert.equal(attempts, 2);
  assert.equal(response.code, 200);
  assert.deepEqual(response.data, { success: true });
});

test('retry does not retry POST requests by default', async () => {
  let attempts = 0;

  const adapter: AxiosAdapter = async (config) => {
    attempts += 1;
    const response = createResponse(
      config,
      {
        message: 'server error',
      },
      500,
    );
    throw new AxiosError('server error', 'ERR_BAD_RESPONSE', config, undefined, response);
  };

  const request = createRequest({
    adapter,
    enableRetry: true,
    retryCount: 2,
    retryDelay: 0,
  });

  await assert.rejects(() => request.post('/retry', { id: 1 }));
  assert.equal(attempts, 1);
});

test('request interceptor injects bearer token when needed', async () => {
  let seenAuthorization: unknown;

  const adapter: AxiosAdapter = async (config) => {
    seenAuthorization = config.headers.Authorization;

    return createResponse(config, {
      code: 200,
      data: { ok: true },
      message: 'ok',
    });
  };

  const request = createRequest({
    adapter,
    getToken: () => 'abc123',
  });

  await request.get('/token');

  assert.equal(seenAuthorization, 'Bearer abc123');
});

test('raw requests skip token injection and business unwrapping', async () => {
  let seenAuthorization: unknown;

  const adapter: AxiosAdapter = async (config) => {
    seenAuthorization = config.headers.Authorization;

    return createResponse(config, {
      code: 200,
      data: { ok: true },
      message: 'ok',
    });
  };

  const request = createRequest({
    adapter,
    getToken: () => 'abc123',
  });

  const response = await request.rawRequest({
    url: '/raw',
    method: 'get',
  });

  assert.equal(seenAuthorization, undefined);
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, {
    code: 200,
    data: { ok: true },
    message: 'ok',
  });
});

test('request({ skipInterceptors: true }) returns raw response', async () => {
  const request = createRequest({
    adapter: async (config) =>
      createResponse(config, {
        code: 200,
        data: { id: 3 },
        message: 'ok',
      }),
  });

  const response = await request.request({
    url: '/raw-request',
    method: 'get',
    skipInterceptors: true,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.data, {
    code: 200,
    data: { id: 3 },
    message: 'ok',
  });
});
