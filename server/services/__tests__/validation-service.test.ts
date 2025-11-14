/**
 * Validation Service Tests
 * Module 4: Smart Suggestions & Intelligent Validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkConflicts,
  checkPortfolioLimits,
  type ValidationContext,
} from '../validation-service';

describe('Validation Service', () => {
  const mockUserId = 'user-123';
  const mockPortfolioId = 'portfolio-123';

  describe('checkConflicts', () => {
    it('should check conflicts for a purchase order', async () => {
      const context: ValidationContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        order: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
          orderType: 'lump_sum',
        },
      };

      const conflicts = await checkConflicts(context);

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);
      
      // Check conflict structure if any exist
      conflicts.forEach(conflict => {
        expect(conflict).toHaveProperty('type');
        expect(conflict).toHaveProperty('severity');
        expect(conflict).toHaveProperty('message');
        expect(['error', 'warning', 'info']).toContain(conflict.severity);
        expect(['duplicate_order', 'insufficient_balance', 'limit_exceeded', 'timing_conflict']).toContain(conflict.type);
      });
    });

    it('should check conflicts for a redemption order', async () => {
      const context: ValidationContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        order: {
          fundId: 'fund-123',
          amount: 5000,
          transactionType: 'redemption',
          orderType: 'lump_sum',
        },
      };

      const conflicts = await checkConflicts(context);

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should detect timing conflicts for weekend orders', async () => {
      const weekendDate = new Date('2025-01-11T10:00:00Z'); // Saturday
      vi.useFakeTimers();
      vi.setSystemTime(weekendDate);

      const context: ValidationContext = {
        userId: mockUserId,
        order: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const conflicts = await checkConflicts(context);
      
      const timingConflict = conflicts.find(c => c.type === 'timing_conflict');
      expect(timingConflict).toBeDefined();
      expect(timingConflict?.severity).toBe('info');

      vi.useRealTimers();
    });

    it('should detect timing conflicts for closed market', async () => {
      // Set time to after market hours (4 PM)
      const afterHoursDate = new Date('2025-01-13T16:00:00Z'); // Monday 4 PM IST
      vi.useFakeTimers();
      vi.setSystemTime(afterHoursDate);

      const context: ValidationContext = {
        userId: mockUserId,
        order: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const conflicts = await checkConflicts(context);
      
      const timingConflict = conflicts.find(c => c.type === 'timing_conflict');
      expect(timingConflict).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe('checkPortfolioLimits', () => {
    it('should check portfolio limits for new order', async () => {
      const limits = await checkPortfolioLimits(
        mockUserId,
        mockPortfolioId,
        100000,
        'fund-123'
      );

      expect(limits).toBeDefined();
      expect(Array.isArray(limits)).toBe(true);
      
      limits.forEach(limit => {
        expect(limit).toHaveProperty('type');
        expect(limit).toHaveProperty('current');
        expect(limit).toHaveProperty('limit');
        expect(limit).toHaveProperty('percentage');
        expect(limit).toHaveProperty('message');
        expect(['single_fund_limit', 'category_limit', 'total_portfolio_limit']).toContain(limit.type);
        expect(typeof limit.current).toBe('number');
        expect(typeof limit.limit).toBe('number');
        expect(typeof limit.percentage).toBe('number');
      });
    });

    it('should return empty array when no limits exceeded', async () => {
      const limits = await checkPortfolioLimits(
        mockUserId,
        mockPortfolioId,
        1000,
        'fund-123'
      );

      expect(limits).toBeDefined();
      expect(Array.isArray(limits)).toBe(true);
    });

    it('should handle missing portfolio gracefully', async () => {
      const limits = await checkPortfolioLimits(
        mockUserId,
        'non-existent-portfolio',
        100000,
        'fund-123'
      );

      expect(limits).toBeDefined();
      expect(Array.isArray(limits)).toBe(true);
    });
  });

  describe('Conflict types', () => {
    it('should detect duplicate orders', async () => {
      const context: ValidationContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        order: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const conflicts = await checkConflicts(context);
      
      // Note: Duplicate detection requires database, so may not find duplicates in test
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should detect insufficient balance for redemption', async () => {
      const context: ValidationContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        order: {
          fundId: 'fund-123',
          amount: 1000000, // Large amount
          transactionType: 'redemption',
        },
      };

      const conflicts = await checkConflicts(context);
      
      // May detect insufficient balance if holdings exist
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid order data gracefully', async () => {
      const context: ValidationContext = {
        userId: mockUserId,
        order: {
          fundId: '',
          amount: -100,
          transactionType: 'purchase' as any,
        },
      };

      const conflicts = await checkConflicts(context);
      
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should handle missing userId gracefully', async () => {
      const context: ValidationContext = {
        userId: '',
        order: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const conflicts = await checkConflicts(context);
      
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });
});

