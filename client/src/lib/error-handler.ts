/**
 * Module 7: Frontend-Backend Integration Enhancement
 * 7.1 API Error Handling
 * 
 * Centralized error handling for all API calls with retry logic,
 * error transformation, and consistent error responses
 */

import { APIError, ValidationError, BusinessLogicError, isRetryableError, extractErrorMessage } from '@shared/utils/errors';
import { ErrorResponse } from '@shared/types/api.types';

export interface ErrorHandlerConfig {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: APIError) => void;
  transformError?: (error: unknown) => APIError;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Default error handler configuration
 */
const defaultConfig: Required<ErrorHandlerConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  onError: (error) => {
    console.error('API Error:', error);
  },
  transformError: (error: unknown) => {
    if (error instanceof APIError) {
      return error;
    }
    
    if (error instanceof Error) {
      // Try to parse error message for status code
      const statusMatch = error.message.match(/^(\d+):/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 500;
      
      // Try to parse JSON error response
      let errorData: any = null;
      try {
        const jsonMatch = error.message.match(/:\s*({.+})$/);
        if (jsonMatch) {
          errorData = JSON.parse(jsonMatch[1]);
        }
      } catch {
        // Not JSON, use message as-is
      }
      
      return new APIError(
        errorData?.message || error.message || 'An unexpected error occurred',
        statusCode,
        errorData?.code,
        errorData?.details
      );
    }
    
    return new APIError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  },
};

let globalConfig: Required<ErrorHandlerConfig> = { ...defaultConfig };

/**
 * Set global error handler configuration
 */
export function setErrorHandlerConfig(config: Partial<ErrorHandlerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current error handler configuration
 */
export function getErrorHandlerConfig(): Required<ErrorHandlerConfig> {
  return { ...globalConfig };
}

/**
 * Transform a fetch Response error into an APIError
 */
export async function transformResponseError(response: Response): Promise<APIError> {
  let errorData: ErrorResponse | null = null;
  
  try {
    const text = await response.text();
    if (text) {
      errorData = JSON.parse(text);
    }
  } catch {
    // Response is not JSON, use status text
  }
  
  const message = errorData?.message || response.statusText || `HTTP ${response.status}`;
  const errors = errorData?.errors || [message];
  const code = errorData?.code || `HTTP_${response.status}`;
  
  return new APIError(
    message,
    response.status,
    code,
    { errors, ...errorData?.details }
  );
}

/**
 * Handle API error with transformation and optional callback
 */
export function handleError(error: unknown, config?: Partial<ErrorHandlerConfig>): APIError {
  const handlerConfig = { ...globalConfig, ...config };
  const apiError = handlerConfig.transformError(error);
  
  // Call error callback
  handlerConfig.onError(apiError);
  
  return apiError;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = globalConfig.maxRetries,
    retryDelay = globalConfig.retryDelay,
    retryCondition = isRetryableError,
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable or max retries reached
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = retryDelay * Math.pow(2, attempt);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create a standardized error response from any error
 */
export function createStandardizedErrorResponse(error: unknown): ErrorResponse {
  const apiError = handleError(error);
  
  return {
    success: false,
    message: apiError.message,
    errors: apiError.details?.errors || [apiError.message],
    code: apiError.code,
    details: apiError.details,
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    );
  }
  return false;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('timeout') ||
      error.message.includes('TIMEOUT') ||
      error.message.includes('ETIMEDOUT')
    );
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const apiError = handleError(error);
  
  // Map common error codes to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'TIMEOUT': 'The request took too long. Please try again.',
    'UNAUTHORIZED': 'Your session has expired. Please log in again.',
    'FORBIDDEN': 'You do not have permission to perform this action.',
    'NOT_FOUND': 'The requested resource was not found.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'SERVER_ERROR': 'A server error occurred. Please try again later.',
  };
  
  if (apiError.code && friendlyMessages[apiError.code]) {
    return friendlyMessages[apiError.code];
  }
  
  // Map status codes to user-friendly messages
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'The request took too long. Please try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The request took too long. Please try again.',
  };
  
  if (statusMessages[apiError.statusCode]) {
    return statusMessages[apiError.statusCode];
  }
  
  return apiError.message;
}

/**
 * Error handler for React Query errors
 */
export function handleQueryError(error: unknown): ErrorResponse {
  return createStandardizedErrorResponse(error);
}

/**
 * Error handler for mutation errors
 */
export function handleMutationError(error: unknown): ErrorResponse {
  return createStandardizedErrorResponse(error);
}

