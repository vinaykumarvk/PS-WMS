/**
 * Foundation Layer - F3: Shared Validation Utilities
 * Common validation functions used across all modules
 */

import type { ValidationResult } from '../types/order-management.types';

/**
 * Validate PAN format
 */
export function validatePAN(pan: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pan) {
    errors.push('PAN is required');
    return { isValid: false, errors, warnings };
  }

  // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(pan)) {
    errors.push('PAN must be in format: ABCDE1234F (5 uppercase letters, 4 digits, 1 uppercase letter)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!phone) {
    errors.push('Phone number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Indian phone: 10 digits starting with 6-9
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  
  if (!indianPhoneRegex.test(cleaned)) {
    errors.push('Phone number must be 10 digits starting with 6-9');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!date) {
    errors.push('Date is required');
    return { isValid: false, errors, warnings };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    errors.push('Date must be in format: YYYY-MM-DD');
    return { isValid: false, errors, warnings };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push('Invalid date');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate date is in the future
 */
export function validateFutureDate(date: string): ValidationResult {
  const result = validateDate(date);
  
  if (!result.isValid) {
    return result;
  }

  const parsedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedDate <= today) {
    result.errors.push('Date must be in the future');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value < 0 || value > 100) {
    errors.push('Percentage must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate percentages total to 100
 */
export function validatePercentagesTotal(percentages: number[], tolerance: number = 0.01): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const total = percentages.reduce((sum, p) => sum + p, 0);
  
  if (Math.abs(total - 100) > tolerance) {
    errors.push(`Percentages must total 100%. Current total: ${total.toFixed(2)}%`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate amount is positive
 */
export function validatePositiveAmount(amount: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate amount is within range
 */
export function validateAmountRange(amount: number, min: number, max?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (amount < min) {
    errors.push(`Amount must be at least ₹${min.toLocaleString()}`);
  }

  if (max !== undefined && amount > max) {
    errors.push(`Amount must not exceed ₹${max.toLocaleString()}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate required field
 */
export function validateRequired<T>(value: T | null | undefined, fieldName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray<T>(array: T[], fieldName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(array) || array.length === 0) {
    errors.push(`${fieldName} cannot be empty`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

