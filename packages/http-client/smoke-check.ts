import { HttpClientError, isBusinessSuccess, isResponseData } from './index.js';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const okPayload = {
    code: 200,
    data: { id: 1 },
    message: 'ok',
  };

  const failPayload = {
    code: 50001,
    data: null,
    message: 'failed',
  };

  assert(isResponseData(okPayload) === true, 'isResponseData should detect response payload');
  assert(isBusinessSuccess(okPayload, {}) === true, 'default success codes should include 200');
  assert(isBusinessSuccess(failPayload, {}) === false, 'unexpected business code should fail');
  assert(
    isBusinessSuccess(failPayload, {
      successCodes: [50001],
    }) === true,
    'custom success codes should be supported',
  );

  const error = new HttpClientError('boom', {
    kind: 'business',
    businessCode: 50001,
    payload: failPayload,
  });

  assert(error.kind === 'business', 'error kind should be business');
  assert(error.businessCode === 50001, 'business code should be preserved');
  assert(error.message === 'boom', 'error message should be preserved');

  console.log('http-client smoke check passed');
}

run();
