import type { ResponseData, RequestConfig } from './config.js';

export function isResponseData(payload: unknown): payload is ResponseData<unknown> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'code' in payload &&
    typeof (payload as { code?: unknown }).code === 'number'
  );
}

export function isBusinessSuccess(
  payload: ResponseData<unknown>,
  config: Pick<RequestConfig, 'successCodes' | 'isBusinessSuccess'>,
) {
  if (config.isBusinessSuccess) {
    return config.isBusinessSuccess(payload);
  }

  const successCodes = config.successCodes ?? [0, 200];
  return successCodes.includes(payload.code);
}
