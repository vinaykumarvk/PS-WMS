/**
 * Foundation Layer - F3: Error Handling Utilities
 * Common error handling functions used across all modules
 */

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Custom error class for business logic errors
 */
export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessLogicError';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  errors?: string[],
  code?: string
): {
  success: false;
  message: string;
  errors: string[];
  code?: string;
} {
  return {
    success: false,
    message,
    errors: errors || [message],
    code,
  };
}

/**
 * Handle API errors consistently
 */
export function handleAPIError(error: unknown): {
  success: false;
  message: string;
  errors: string[];
  code?: string;
} {
  if (error instanceof APIError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      [error.message],
      error.code
    );
  }
  
  if (error instanceof ValidationError) {
    return createErrorResponse(
      error.message,
      400,
      error.errors || [error.message],
      'VALIDATION_ERROR'
    );
  }
  
  if (error instanceof BusinessLogicError) {
    return createErrorResponse(
      error.message,
      400,
      [error.message],
      error.code || 'BUSINESS_LOGIC_ERROR'
    );
  }
  
  if (error instanceof Error) {
    return createErrorResponse(
      error.message,
      500,
      [error.message],
      'INTERNAL_ERROR'
    );
  }
  
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    ['An unexpected error occurred'],
    'UNKNOWN_ERROR'
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on 5xx errors, not on 4xx errors
    return error.statusCode >= 500;
  }
  
  // Network errors are retryable
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('timeout') ||
           error.message.includes('ECONNREFUSED');
  }
  
  return false;
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unknown error occurred';
}

