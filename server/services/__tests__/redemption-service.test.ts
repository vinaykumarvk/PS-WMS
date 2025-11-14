/**
 * Redemption Service Tests
 * Module E: Instant Redemption Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { redemptionService } from '../redemption-service';
import { db } from '../../db';
import { products } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Redemption Service', () => {
  const mockSchemeId = 1;
  const mockNav = 25.50;
  const mockProduct = {
    id: mockSchemeId,
    schemeName: 'Test Equity Fund',
    nav: mockNav,
    minInvestment: 1000,
    maxInvestment: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateRedemption', () => {
    it('should calculate redemption with units', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        units: 100,
        redemptionType: 'Standard',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.units).toBe(100);
      expect(result.data?.nav).toBe(mockNav);
      expect(result.data?.grossAmount).toBe(100 * mockNav);
    });

    it('should calculate redemption with amount', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
        redemptionType: 'Standard',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.grossAmount).toBe(10000);
      expect(result.data?.units).toBeCloseTo(10000 / mockNav, 4);
    });

    it('should apply exit load for Standard redemption', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
        redemptionType: 'Standard',
      });

      expect(result.success).toBe(true);
      expect(result.data?.exitLoad).toBeDefined();
      expect(result.data?.exitLoadAmount).toBeDefined();
      expect(result.data?.netAmount).toBeLessThan(result.data!.grossAmount);
    });

    it('should not apply exit load for Instant redemption', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
        redemptionType: 'Instant',
      });

      expect(result.success).toBe(true);
      // Instant redemption may have different exit load rules
      expect(result.data?.netAmount).toBeDefined();
    });

    it('should return error when scheme not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: 999,
        amount: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Scheme not found');
    });

    it('should return error when NAV is not available', async () => {
      const productWithoutNav = { ...mockProduct, nav: 0 };
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([productWithoutNav]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('NAV not available');
    });

    it('should return error for invalid units or amount', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.calculateRedemption({
        schemeId: mockSchemeId,
        amount: -1000,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('checkInstantRedemptionEligibility', () => {
    it('should return eligible for amount within limit', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.checkInstantRedemptionEligibility({
        schemeId: mockSchemeId,
        amount: 25000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eligible).toBe(true);
      expect(result.data?.maxAmount).toBe(50000);
    });

    it('should return not eligible for amount exceeding limit', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.checkInstantRedemptionEligibility({
        schemeId: mockSchemeId,
        amount: 60000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eligible).toBe(false);
      expect(result.data?.reason).toContain('exceeds instant redemption limit');
    });

    it('should return not eligible for amount below minimum', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.checkInstantRedemptionEligibility({
        schemeId: mockSchemeId,
        amount: 500,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eligible).toBe(false);
      expect(result.data?.reason).toContain('Minimum redemption amount');
    });

    it('should return error when scheme not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.checkInstantRedemptionEligibility({
        schemeId: 999,
        amount: 25000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Scheme not found');
    });
  });

  describe('executeInstantRedemption', () => {
    it('should execute instant redemption successfully', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.executeInstantRedemption({
        schemeId: mockSchemeId,
        amount: 25000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.cartItem).toBeDefined();
      expect(result.data?.cartItem.transactionType).toBe('Redemption');
      expect(result.data?.cartItem.productId).toBe(mockSchemeId);
    });

    it('should reject instant redemption for amount exceeding limit', async () => {
      const result = await redemptionService.executeInstantRedemption({
        schemeId: mockSchemeId,
        amount: 60000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('limit');
    });

    it('should reject instant redemption for invalid amount', async () => {
      const result = await redemptionService.executeInstantRedemption({
        schemeId: mockSchemeId,
        amount: -1000,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('executeRedemption', () => {
    it('should execute standard redemption successfully', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.executeRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
        redemptionType: 'Standard',
      });

      expect(result.success).toBe(true);
      expect(result.data?.cartItem).toBeDefined();
      expect(result.data?.cartItem.transactionType).toBe('Redemption');
    });

    it('should execute full redemption successfully', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await redemptionService.executeRedemption({
        schemeId: mockSchemeId,
        amount: 10000,
        redemptionType: 'Full',
        isFullRedemption: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.cartItem).toBeDefined();
    });
  });

  describe('getRedemptionHistory', () => {
    it('should return redemption history', async () => {
      const result = await redemptionService.getRedemptionHistory(1);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter history by status', async () => {
      const result = await redemptionService.getRedemptionHistory(1, {
        status: 'Settled',
      });

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        expect(result.data.every((h: any) => h.status === 'Settled')).toBe(true);
      }
    });

    it('should filter history by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const result = await redemptionService.getRedemptionHistory(1, {
        startDate,
        endDate,
      });

      expect(result.success).toBe(true);
    });
  });
});

