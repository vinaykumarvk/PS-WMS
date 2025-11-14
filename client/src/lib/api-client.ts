/**
 * Module 7: Frontend-Backend Integration Enhancement
 * Enhanced API Client
 * 
 * Centralized API client with error handling, retry logic, timeout,
 * request/response interceptors, and consistent error responses
 */

import { APIError } from '@shared/utils/errors';
import { ErrorResponse, APIResponse } from '@shared/types/api.types';
import {
  handleError,
  transformResponseError,
  retryWithBackoff,
  isNetworkError,
  isTimeoutError,
  getUserFriendlyErrorMessage,
  RetryOptions,
} from './error-handler';
import { apiCache, cacheTTLs } from './api-cache';
import { measureAPICall, performanceMonitor } from './performance-monitor';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  retry?: RetryOptions;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
}

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retry?: RetryOptions;
  skipCache?: boolean;
  cacheTTL?: number;
  data?: any; // Alias for body, but will be JSON stringified
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: APIError) => APIError | Promise<APIError>;

class ApiClient {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      credentials: config.credentials || 'include',
      retry: config.retry || {},
      cache: {
        enabled: config.cache?.enabled !== false,
        ttl: config.cache?.ttl,
      },
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    const baseURL = this.config.baseURL || '';
    const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullURL;
    }
    
    const urlObj = new URL(fullURL, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    
    return urlObj.pathname + urlObj.search;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    return finalConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: APIError): Promise<APIError> {
    let finalError = error;
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError);
    }
    return finalError;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new APIError('Request timeout', 408, 'TIMEOUT'));
      }, timeout);
    });
  }

  /**
   * Determine cache TTL based on URL
   */
  private getCacheTTL(url: string, customTTL?: number): number {
    if (customTTL !== undefined) {
      return customTTL;
    }
    
    if (url.includes('/products')) return cacheTTLs.products;
    if (url.includes('/portfolio')) return cacheTTLs.portfolio;
    if (url.includes('/holdings')) return cacheTTLs.holdings;
    if (url.includes('/favorites')) return cacheTTLs.favorites;
    if (url.includes('/recent-orders')) return cacheTTLs.recentOrders;
    if (url.includes('/sip')) return cacheTTLs.sipPlans;
    
    return cacheTTLs.products; // default
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(config);
    
    const url = this.buildURL(finalConfig.url, finalConfig.params);
    const method = finalConfig.method || 'GET';
    const timeout = finalConfig.timeout || this.config.timeout;
    const skipCache = finalConfig.skipCache || false;
    const cacheTTL = finalConfig.cacheTTL || this.getCacheTTL(url);
    
    // Check cache for GET requests
    if (method === 'GET' && this.config.cache.enabled && !skipCache) {
      const cached = apiCache.get<T>(url);
      if (cached) {
        performanceMonitor.record(`api:cache-hit:${url}`, 0, { url, method });
        return cached;
      }
    }

    // Create request function
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await Promise.race([
          fetch(url, {
            method,
            headers: {
              ...this.config.headers,
              ...finalConfig.headers,
            },
            body: finalConfig.body || (finalConfig.data ? JSON.stringify(finalConfig.data) : undefined),
            credentials: this.config.credentials,
            signal: controller.signal,
          }),
          this.createTimeoutPromise(timeout),
        ]);
        
        clearTimeout(timeoutId);
        
        // Apply response interceptors
        const interceptedResponse = await this.applyResponseInterceptors(response);
        
        if (!interceptedResponse.ok) {
          const error = await transformResponseError(interceptedResponse);
          const finalError = await this.applyErrorInterceptors(error);
          throw finalError;
        }
        
        const data = await interceptedResponse.json();
        
        // Cache GET responses
        if (method === 'GET' && this.config.cache.enabled && !skipCache) {
          apiCache.set(url, data, cacheTTL);
        }
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new APIError('Request timeout', 408, 'TIMEOUT');
        }
        
        // Handle network errors
        if (isNetworkError(error) || isTimeoutError(error)) {
          throw handleError(error);
        }
        
        // Re-throw API errors
        if (error instanceof APIError) {
          const finalError = await this.applyErrorInterceptors(error);
          throw finalError;
        }
        
        // Transform and throw other errors
        throw handleError(error);
      }
    };

    // Execute request with retry logic
    const retryOptions = finalConfig.retry || this.config.retry;
    return measureAPICall(url, () => retryWithBackoff(makeRequest, retryOptions));
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: <T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => apiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => apiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: Omit<RequestConfig, 'url' | 'method'>) => apiClient.delete<T>(url, config),
  request: <T = any>(config: RequestConfig) => apiClient.request<T>(config),
};

