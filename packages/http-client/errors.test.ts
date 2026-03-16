import assert from 'node:assert/strict';
import test from 'node:test';
import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { HttpClientError, createAxiosError, createBusinessError } from './errors.js';

test('createBusinessError preserves business metadata', () => {
  const error = createBusinessError({
    code: 40001,
    data: null,
    message: 'denied',
  });

  assert.equal(error instanceof HttpClientError, true);
  assert.equal(error.kind, 'business');
  assert.equal(error.businessCode, 40001);
  assert.equal(error.message, 'denied');
});

test('createAxiosError classifies http and network failures', () => {
  const httpError = createAxiosError(
    new AxiosError('bad gateway', 'ERR_BAD_RESPONSE', undefined, undefined, {
      config: {
        headers: {},
      } as InternalAxiosRequestConfig,
      data: { message: 'server error' },
      headers: {},
      status: 502,
      statusText: 'Bad Gateway',
    }),
    'bad gateway',
  );

  assert.equal(httpError.kind, 'http');
  assert.equal(httpError.status, 502);

  const networkError = createAxiosError(new AxiosError('network down'), 'network down');

  assert.equal(networkError.kind, 'network');
  assert.equal(networkError.status, undefined);
  assert.equal(networkError.originalError instanceof AxiosError, true);
});
