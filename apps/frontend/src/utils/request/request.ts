import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  isCancel,
} from "axios";
import { BASE_CONFIG, type RequestConfig, type ResponseData } from "./config";
import { checkStatus } from "./checkStatus";

export { checkStatus };
export type { RequestConfig, ResponseData };

const SUCCESS_CODES = new Set([0, 200]);

export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

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
          if (token && finalConfig.headers) {
            finalConfig.headers.Authorization =
              typeof token === "string" && token.startsWith("Bearer") ? token : `Bearer ${token}`;
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

        const res = response.data as ResponseData;
        const hasBusinessCode =
          typeof res === "object" && res !== null && "code" in res && typeof res.code === "number";

        if (hasBusinessCode && !SUCCESS_CODES.has(res.code)) {
          checkStatus(
            res.code,
            res.message || res.msg || "",
            config.onUnauthorized,
            config.onErrorAlert,
          );
          return Promise.reject(res);
        }

        return res as unknown as AxiosResponse;
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

          if (requestConfig.__retryCount < config.retryCount) {
            requestConfig.__retryCount += 1;

            const backoff = new Promise((resolve) => {
              setTimeout(() => {
                resolve(null);
              }, config.retryDelay || 1000);
            });

            await backoff;
            return this.service(requestConfig);
          }
        }

        if (!config.isSkipErrorHandler) {
          if (error.response) {
            const message = (error.response.data as ResponseData)?.message || error.message;
            checkStatus(error.response.status, message, config.onUnauthorized, config.onErrorAlert);
          } else {
            if (typeof window !== "undefined" && !window.navigator.onLine) {
              console.error("[Network Error]: 网络连接已断开");
            } else {
              checkStatus(0, error.message, config.onUnauthorized, config.onErrorAlert);
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, params?: object, _object = {}): Promise<ResponseData<T>> {
    return this.service.get(url, { params, ..._object }) as unknown as Promise<ResponseData<T>>;
  }

  post<T>(url: string, params?: object | string, _object = {}): Promise<ResponseData<T>> {
    return this.service.post(url, params, _object) as unknown as Promise<ResponseData<T>>;
  }

  put<T>(url: string, params?: object, _object = {}): Promise<ResponseData<T>> {
    return this.service.put(url, params, _object) as unknown as Promise<ResponseData<T>>;
  }

  patch<T>(url: string, params?: object, _object = {}): Promise<ResponseData<T>> {
    return this.service.patch(url, params, _object) as unknown as Promise<ResponseData<T>>;
  }

  delete<T>(url: string, params?: object, _object = {}): Promise<ResponseData<T>> {
    return this.service.delete(url, {
      params,
      ..._object,
    }) as unknown as Promise<ResponseData<T>>;
  }

  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.service.post(url, params, {
      ..._object,
      responseType: "blob",
    }) as unknown as Promise<BlobPart>;
  }

  request<T = unknown>(config: RequestConfig): Promise<T> {
    return this.service.request<T>(config) as unknown as Promise<T>;
  }
}

export function createRequest(config: RequestConfig = {}) {
  return new RequestHttp(config);
}
