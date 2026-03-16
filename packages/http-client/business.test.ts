import assert from 'node:assert/strict';
import test from 'node:test';
import { isBusinessSuccess, isResponseData } from './business.js';

test('isResponseData detects the shared response envelope', () => {
  assert.equal(
    isResponseData({
      code: 200,
      data: { id: 1 },
      message: 'ok',
    }),
    true,
  );

  assert.equal(
    isResponseData({
      data: { id: 1 },
      message: 'missing code',
    }),
    false,
  );
});

test('isBusinessSuccess uses default and custom success strategies', () => {
  const payload = {
    code: 50001,
    data: null,
    message: 'failed',
  };

  assert.equal(isBusinessSuccess(payload, {}), false);
  assert.equal(isBusinessSuccess(payload, { successCodes: [50001] }), true);
  assert.equal(
    isBusinessSuccess(payload, {
      isBusinessSuccess: (response) => response.code === 50001,
    }),
    true,
  );
});
