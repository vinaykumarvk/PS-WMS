/**
 * Foundation Layer - F3: Formatting Utilities Tests
 * Comprehensive test suite for formatting functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatIndianNumber,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatUnits,
  formatNAV,
  formatLargeNumber,
  maskString,
  maskPAN,
  maskPhone,
  formatOrderId,
  formatStatus,
} from '../formatting';

describe('Foundation Layer - F3: Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format currency with symbol by default', () => {
      const result = formatCurrency(100000);
      expect(result).toContain('₹');
      expect(result).toContain('1,00,000');
    });

    it('should format currency without symbol when specified', () => {
      const result = formatCurrency(100000, { showSymbol: false });
      expect(result).not.toContain('₹');
      expect(result).toContain('1,00,000');
    });

    it('should format with custom decimals', () => {
      const result = formatCurrency(100000.123, { decimals: 4 });
      expect(result).toContain('1,00,000.1230');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('-');
    });
  });

  describe('formatIndianNumber', () => {
    it('should format crores', () => {
      const result = formatIndianNumber(10000000);
      expect(result).toContain('Cr');
      expect(result).toContain('1.00');
    });

    it('should format lakhs', () => {
      const result = formatIndianNumber(100000);
      expect(result).toContain('L');
      expect(result).toContain('1.00');
    });

    it('should format thousands', () => {
      const result = formatIndianNumber(5000);
      expect(result).toContain('K');
      expect(result).toContain('5.00');
    });

    it('should format small numbers as currency', () => {
      const result = formatIndianNumber(500);
      expect(result).toContain('₹');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      const result = formatPercentage(50.1234);
      expect(result).toBe('50.12%');
    });

    it('should format percentage with custom decimals', () => {
      const result = formatPercentage(50.1234, 4);
      expect(result).toBe('50.1234%');
    });

    it('should handle zero percentage', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle 100 percentage', () => {
      expect(formatPercentage(100)).toBe('100.00%');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
    });

    it('should format with correct day', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('15');
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00');
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateTime(date);
      expect(result).toContain(':');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format "Just now" for recent times', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      const result = formatRelativeTime(date);
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    it('should format hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 2);
      const result = formatRelativeTime(date);
      expect(result).toContain('hour');
    });

    it('should format days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const result = formatRelativeTime(date);
      expect(result).toContain('day');
    });

    it('should format date for older times', () => {
      const date = new Date();
      date.setDate(date.getDate() - 10);
      const result = formatRelativeTime(date);
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
    });
  });

  describe('formatUnits', () => {
    it('should format units with default decimals', () => {
      const result = formatUnits(123.456789);
      expect(result).toBe('123.4568');
    });

    it('should format units with custom decimals', () => {
      const result = formatUnits(123.456789, 2);
      expect(result).toBe('123.46');
    });

    it('should handle zero units', () => {
      expect(formatUnits(0)).toBe('0.0000');
    });
  });

  describe('formatNAV', () => {
    it('should format NAV as currency', () => {
      const result = formatNAV(50.25);
      expect(result).toContain('₹');
      expect(result).toContain('50.25');
    });

    it('should format NAV with 2 decimals', () => {
      const result = formatNAV(50.256);
      expect(result).toContain('50.26');
    });
  });

  describe('formatLargeNumber', () => {
    it('should format billions', () => {
      const result = formatLargeNumber(1500000000);
      expect(result).toContain('B');
      expect(result).toContain('1.50');
    });

    it('should format millions', () => {
      const result = formatLargeNumber(1500000);
      expect(result).toContain('M');
      expect(result).toContain('1.50');
    });

    it('should format thousands', () => {
      const result = formatLargeNumber(1500);
      expect(result).toContain('K');
      expect(result).toContain('1.50');
    });

    it('should format small numbers as string', () => {
      expect(formatLargeNumber(500)).toBe('500');
    });
  });

  describe('maskString', () => {
    it('should mask string with default visibility', () => {
      const result = maskString('ABCDEFGHIJ');
      expect(result).toMatch(/^AB\*+IJ$/);
    });

    it('should mask string with custom visibility', () => {
      const result = maskString('ABCDEFGHIJ', 3, 3);
      expect(result).toMatch(/^ABC\*+HIJ$/);
    });

    it('should fully mask short strings', () => {
      const result = maskString('AB');
      expect(result).toBe('**');
    });
  });

  describe('maskPAN', () => {
    it('should mask PAN showing last 4 characters', () => {
      const result = maskPAN('ABCDE1234F');
      // PAN: ABCDE1234F, last 4 characters are '234F'
      expect(result).toBe('****234F');
    });

    it('should handle short PAN', () => {
      const result = maskPAN('AB');
      expect(result).toBe('****');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone showing last 4 digits', () => {
      const result = maskPhone('9876543210');
      expect(result).toBe('****3210');
    });

    it('should handle phone with formatting', () => {
      const result = maskPhone('+91 98765 43210');
      expect(result).toBe('****3210');
    });

    it('should handle short phone', () => {
      const result = maskPhone('123');
      expect(result).toBe('****');
    });
  });

  describe('formatOrderId', () => {
    it('should uppercase order ID', () => {
      const result = formatOrderId('mo-20240115-12345');
      expect(result).toBe('MO-20240115-12345');
    });

    it('should handle already uppercase', () => {
      const result = formatOrderId('MO-20240115-12345');
      expect(result).toBe('MO-20240115-12345');
    });
  });

  describe('formatStatus', () => {
    it('should format camelCase status', () => {
      const result = formatStatus('pendingApproval');
      expect(result).toBe('Pending approval');
    });

    it('should format PascalCase status', () => {
      const result = formatStatus('InProgress');
      expect(result).toBe('In progress');
    });

    it('should format single word status', () => {
      const result = formatStatus('Pending');
      expect(result).toBe('Pending');
    });
  });
});

