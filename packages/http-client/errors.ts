import type { AxiosError, AxiosResponse } from 'axios';
import type { ResponseData } from './config.js';

export type HttpClientErrorKind = 'http' | 'business' | 'network' | 'unknown';

export class HttpClientError<T = unknown> extends Error {
  kind: HttpClientErrorKind;
  status?: number;
  businessCode?: number;
  response?: AxiosResponse<T>;
  payload?: ResponseData<T> | T | unknown;
  originalError?: unknown;

  constructor(
    message: string,
    options: {
      kind: HttpClientErrorKind;
      status?: number;
      businessCode?: number;
      response?: AxiosResponse<T>;
      payload?: ResponseData<T> | T | unknown;
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = 'HttpClientError';
    this.kind = options.kind;
    this.status = options.status;
    this.businessCode = options.businessCode;
    this.response = options.response;
    this.payload = options.payload;
    this.originalError = options.originalError;
  }
}

export function createBusinessError<T = unknown>(payload: ResponseData<T>) {
  return new HttpClientError(payload.message || payload.msg || '业务请求失败', {
    kind: 'business',
    businessCode: payload.code,
    payload,
  });
}

export function createAxiosError(error: AxiosError, message: string) {
  return new HttpClientError(message, {
    kind: error.response ? 'http' : 'network',
    status: error.response?.status,
    response: error.response,
    payload: error.response?.data,
    originalError: error,
  });
}
