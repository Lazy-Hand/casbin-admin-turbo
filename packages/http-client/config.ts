import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  enableRetry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  skipInterceptors?: boolean;
  isSkipErrorHandler?: boolean;
  enableCache?: boolean;
  getToken?: () => string | null | undefined;
  setToken?: (token: string, expireAt?: string) => void;
  onUnauthorized?: () => void;
  onErrorAlert?: (msg: string) => void;
  onRequestStart?: (config: RequestConfig) => void;
  onResponseSuccess?: (response: AxiosResponse) => void;
  onRequestError?: (error: AxiosError) => void;
  onResponseError?: (error: AxiosError | unknown) => void;
  successCodes?: number[];
  isBusinessSuccess?: (payload: ResponseData<unknown>) => boolean;
  shouldRetry?: (error: AxiosError, config: RequestConfig) => boolean;
  retryMethods?: string[];
}

export interface ResponseData<T = unknown> {
  code: number;
  data: T;
  message: string;
  msg?: string;
}

export interface PageResponse<T = unknown> {
  list: T[];
  total: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const BASE_CONFIG: RequestConfig = {
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  enableRetry: false,
};
