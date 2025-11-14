/**
 * Foundation Layer - F3: Error Handling Utilities Tests
 * Comprehensive test suite for error handling functions
 */

import { describe, it, expect } from 'vitest';
import {
  APIError,
  ValidationError,
  BusinessLogicError,
  createErrorResponse,
  handleAPIError,
  isRetryableError,
  extractErrorMessage,
} from '../errors';

describe('Foundation Layer - F3: Error Handling Utilities', () => {
  describe('APIError', () => {
    it('should create APIError with message', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('APIError');
      expect(error.statusCode).toBe(500);
    });

    it('should create APIError with custom status code', () => {
      const error = new APIError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should create APIError with code and details', () => {
      const error = new APIError('Error', 400, 'VALIDATION_ERROR', { field: 'email' });
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should be instance of Error', () => {
      const error = new APIError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with message', () => {
      const error = new ValidationError('Validation failed');
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with field and errors', () => {
      const error = new ValidationError('Invalid', 'email', ['Invalid format']);
      expect(error.field).toBe('email');
      expect(error.errors).toEqual(['Invalid format']);
    });

    it('should be instance of Error', () => {
      const error = new ValidationError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BusinessLogicError', () => {
    it('should create BusinessLogicError with message', () => {
      const error = new BusinessLogicError('Business rule violation');
      expect(error.message).toBe('Business rule violation');
      expect(error.name).toBe('BusinessLogicError');
    });

    it('should create BusinessLogicError with code and details', () => {
      const error = new BusinessLogicError('Error', 'INSUFFICIENT_FUNDS', { balance: 100 });
      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.details).toEqual({ balance: 100 });
    });

    it('should be instance of Error', () => {
      const error = new BusinessLogicError('Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with message', () => {
      const response = createErrorResponse('Error occurred');
      expect(response.success).toBe(false);
      expect(response.message).toBe('Error occurred');
      expect(response.errors).toEqual(['Error occurred']);
    });

    it('should create error response with custom status code', () => {
      const response = createErrorResponse('Not found', 404);
      expect(response.message).toBe('Not found');
    });

    it('should create error response with errors array', () => {
      const response = createErrorResponse('Validation failed', 400, ['Error 1', 'Error 2']);
      expect(response.errors).toEqual(['Error 1', 'Error 2']);
    });

    it('should create error response with code', () => {
      const response = createErrorResponse('Error', 400, [], 'VALIDATION_ERROR');
      expect(response.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('handleAPIError', () => {
    it('should handle APIError', () => {
      const error = new APIError('API error', 400, 'BAD_REQUEST');
      const response = handleAPIError(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('API error');
      expect(response.code).toBe('BAD_REQUEST');
    });

    it('should handle ValidationError', () => {
      const error = new ValidationError('Validation failed', 'email', ['Invalid']);
      const response = handleAPIError(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.errors).toEqual(['Invalid']);
    });

    it('should handle BusinessLogicError', () => {
      const error = new BusinessLogicError('Business error', 'INSUFFICIENT_FUNDS');
      const response = handleAPIError(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Business error');
      expect(response.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      const response = handleAPIError(error);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Generic error');
      expect(response.code).toBe('INTERNAL_ERROR');
    });

    it('should handle unknown error types', () => {
      const response = handleAPIError('String error');
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('An unexpected error occurred');
      expect(response.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle null/undefined errors', () => {
      const response = handleAPIError(null);
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('An unexpected error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for 5xx APIError', () => {
      const error = new APIError('Server error', 500);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for 4xx APIError', () => {
      const error = new APIError('Client error', 400);
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for network errors', () => {
      // The implementation checks for lowercase 'network' in the message
      const error = new Error('network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for connection refused errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new Error('Validation error');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for ValidationError', () => {
      const error = new ValidationError('Invalid');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error', () => {
      const error = new Error('Test error');
      expect(extractErrorMessage(error)).toBe('Test error');
    });

    it('should return string as-is', () => {
      expect(extractErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error' };
      expect(extractErrorMessage(error)).toBe('Object error');
    });

    it('should return default message for unknown types', () => {
      expect(extractErrorMessage(null)).toBe('An unknown error occurred');
      expect(extractErrorMessage(123)).toBe('An unknown error occurred');
    });
  });
});

