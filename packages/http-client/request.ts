import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  isCancel,
} from 'axios';
import { isBusinessSuccess, isResponseData } from './business.js';
import { checkStatus } from './check-status.js';
import { BASE_CONFIG, type RequestConfig, type ResponseData } from './config.js';
import { createAxiosError, createBusinessError, HttpClientError } from './errors.js';

export { checkStatus };
export type { RequestConfig, ResponseData };

export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

type RequestMethodOptions = Omit<RequestConfig, 'skipInterceptors'>;

export class RequestHttp {
  service: AxiosInstance;
  config: RequestConfig;

  constructor(config: RequestConfig) {
    this.config = { ...BASE_CONFIG, ...config };
    this.service = axios.create(this.config);

    this.service.interceptors.request.use(
      (reqConfig: CustomInternalAxiosRequestConfig & RequestConfig) => {
        const finalConfig = { ...this.config, ...reqConfig };

        if (finalConfig.skipInterceptors) {
          return finalConfig;
        }

        if (finalConfig.getToken) {
          const token = finalConfig.getToken();
          if (token) {
            const headers = finalConfig.headers ?? {};
            headers.Authorization =
              typeof token === 'string' && token.startsWith('Bearer') ? token : `Bearer ${token}`;
            finalConfig.headers = headers;
          }
        }

        finalConfig.onRequestStart?.(finalConfig);
        return finalConfig;
      },
      (error: AxiosError) => {
        this.config.onRequestError?.(error);
        return Promise.reject(error);
      },
    );

    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = {
          ...this.config,
          ...(response.config as RequestConfig),
        };

        config.onResponseSuccess?.(response);

        if (config.skipInterceptors) {
          return response;
        }

        const payload = response.data;
        if (isResponseData(payload) && !isBusinessSuccess(payload, config)) {
          checkStatus(
            payload.code,
            payload.message || payload.msg || '',
            config.onUnauthorized,
            config.onErrorAlert,
          );
          return Promise.reject(createBusinessError(payload));
        }

        return payload as unknown as AxiosResponse;
      },
      async (error: AxiosError) => {
        const config = {
          ...this.config,
          ...(error.config as CustomInternalAxiosRequestConfig & RequestConfig),
        };

        config.onResponseError?.(error);

        if (isCancel(error)) {
          return Promise.reject(error);
        }

        if (config.enableRetry && config.retryCount && config.retryCount > 0 && error.config) {
          const requestConfig = error.config as CustomInternalAxiosRequestConfig;
          requestConfig.__retryCount = requestConfig.__retryCount || 0;
          const method = requestConfig.method?.toUpperCase() ?? 'GET';
          const retryMethods = config.retryMethods ?? ['GET', 'HEAD', 'OPTIONS'];
          const canRetryByMethod = retryMethods.includes(method);
          const canRetryByStatus =
            !error.response || (error.response.status >= 500 && error.response.status < 600);
          const shouldRetry = config.shouldRetry
            ? config.shouldRetry(error, config)
            : canRetryByMethod && canRetryByStatus;

          if (shouldRetry && requestConfig.__retryCount < config.retryCount) {
            requestConfig.__retryCount += 1;

            await new Promise((resolve) => {
              setTimeout(resolve, config.retryDelay ?? 1000);
            });

            return this.service(requestConfig);
          }
        }

        if (!config.isSkipErrorHandler) {
          if (error.response) {
            const message = (error.response.data as ResponseData)?.message || error.message;
            checkStatus(error.response.status, message, config.onUnauthorized, config.onErrorAlert);
          } else if (typeof window !== 'undefined' && !window.navigator.onLine) {
            console.error('[Network Error]: 网络连接已断开');
          } else {
            checkStatus(0, error.message, config.onUnauthorized, config.onErrorAlert);
          }
        }

        return Promise.reject(createAxiosError(error, error.message));
      },
    );
  }

  get<T>(url: string, params?: object, options: RequestMethodOptions = {}): Promise<ResponseData<T>> {
    return this.service.get(url, { params, ...options }) as unknown as Promise<ResponseData<T>>;
  }

  post<T>(url: string, params?: object | string, options: RequestMethodOptions = {}): Promise<ResponseData<T>> {
    return this.service.post(url, params, options) as unknown as Promise<ResponseData<T>>;
  }

  put<T>(url: string, params?: object, options: RequestMethodOptions = {}): Promise<ResponseData<T>> {
    return this.service.put(url, params, options) as unknown as Promise<ResponseData<T>>;
  }

  patch<T>(url: string, params?: object, options: RequestMethodOptions = {}): Promise<ResponseData<T>> {
    return this.service.patch(url, params, options) as unknown as Promise<ResponseData<T>>;
  }

  delete<T>(url: string, params?: object, options: RequestMethodOptions = {}): Promise<ResponseData<T>> {
    return this.service.delete(url, {
      params,
      ...options,
    }) as unknown as Promise<ResponseData<T>>;
  }

  download(url: string, params?: object, options: RequestMethodOptions = {}): Promise<ResponseData<Blob>> {
    return this.service.post(url, params, {
      ...options,
      responseType: 'blob',
    }) as unknown as Promise<ResponseData<Blob>>;
  }

  request<T = unknown>(config: RequestConfig & { skipInterceptors: true }): Promise<AxiosResponse<T>>;
  request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>>;
  request<T = unknown>(config: RequestConfig): Promise<ResponseData<T> | AxiosResponse<T>> {
    return this.service.request<T>(config) as unknown as Promise<ResponseData<T> | AxiosResponse<T>>;
  }

  rawGet<T>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.service.get<T>(url, { ...config, skipInterceptors: true } as RequestConfig);
  }

  rawPost<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.service.post<T>(url, data, { ...config, skipInterceptors: true } as RequestConfig);
  }

  rawPut<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.service.put<T>(url, data, { ...config, skipInterceptors: true } as RequestConfig);
  }

  rawPatch<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.service.patch<T>(url, data, { ...config, skipInterceptors: true } as RequestConfig);
  }

  rawDelete<T>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.service.delete<T>(url, { ...config, skipInterceptors: true } as RequestConfig);
  }

  rawDownload(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<AxiosResponse<Blob>> {
    return this.service.post<Blob>(url, data, {
      ...config,
      responseType: 'blob',
      skipInterceptors: true,
    } as RequestConfig);
  }

  rawRequest<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.service.request<T>({ ...config, skipInterceptors: true } as RequestConfig);
  }
}

export function createRequest(config: RequestConfig = {}) {
  return new RequestHttp(config);
}

export { HttpClientError };
