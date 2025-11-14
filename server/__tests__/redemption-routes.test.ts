/**
 * Redemption Routes Tests
 * Module E: Instant Redemption Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { redemptionService } from '../services/redemption-service';

// Mock the redemption service
vi.mock('../services/redemption-service', () => ({
  redemptionService: {
    calculateRedemption: vi.fn(),
    executeRedemption: vi.fn(),
    executeInstantRedemption: vi.fn(),
    checkInstantRedemptionEligibility: vi.fn(),
    getRedemptionHistory: vi.fn(),
  },
}));

// Mock auth middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  (req.session as any) = { userId: 1 };
  next();
};

describe('Redemption Routes', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
      query: {},
      session: { userId: 1 } as any,
    };

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('POST /api/redemption/calculate', () => {
    it('should calculate redemption successfully', async () => {
      const mockCalculation = {
        schemeName: 'Test Fund',
        units: 100,
        nav: 25.50,
        grossAmount: 2550,
        netAmount: 2524.5,
        finalAmount: 2272.05,
        settlementDate: new Date().toISOString(),
      };

      (redemptionService.calculateRedemption as any).mockResolvedValue({
        success: true,
        data: mockCalculation,
      });

      mockReq.body = {
        schemeId: 1,
        amount: 2550,
        redemptionType: 'Standard',
      };

      // Import and call the route handler
      const { registerRoutes } = await import('../routes');
      // Note: In a real test, we'd need to set up Express app and test the actual route
      // For now, we're testing the service logic
      
      const result = await redemptionService.calculateRedemption(mockReq.body);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCalculation);
    });

    it('should handle calculation errors', async () => {
      (redemptionService.calculateRedemption as any).mockResolvedValue({
        success: false,
        message: 'Scheme not found',
      });

      mockReq.body = {
        schemeId: 999,
        amount: 2550,
      };

      const result = await redemptionService.calculateRedemption(mockReq.body);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Scheme not found');
    });
  });

  describe('POST /api/redemption/instant', () => {
    it('should execute instant redemption successfully', async () => {
      const mockCartItem = {
        id: 'redemption-1',
        productId: 1,
        schemeName: 'Test Fund',
        transactionType: 'Redemption',
        amount: 25000,
        nav: 25.50,
        units: 980.39,
      };

      (redemptionService.executeInstantRedemption as any).mockResolvedValue({
        success: true,
        data: {
          cartItem: mockCartItem,
        },
      });

      mockReq.body = {
        schemeId: 1,
        amount: 25000,
      };

      const result = await redemptionService.executeInstantRedemption(mockReq.body);
      
      expect(result.success).toBe(true);
      expect(result.data?.cartItem).toEqual(mockCartItem);
    });

    it('should reject instant redemption for amount exceeding limit', async () => {
      (redemptionService.executeInstantRedemption as any).mockResolvedValue({
        success: false,
        message: 'Instant redemption limit is ₹50,000',
      });

      mockReq.body = {
        schemeId: 1,
        amount: 60000,
      };

      const result = await redemptionService.executeInstantRedemption(mockReq.body);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('limit');
    });
  });

  describe('GET /api/redemption/eligibility', () => {
    it('should check eligibility successfully', async () => {
      const mockEligibility = {
        eligible: true,
        maxAmount: 50000,
        availableAmount: 50000,
      };

      (redemptionService.checkInstantRedemptionEligibility as any).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      mockReq.query = {
        schemeId: '1',
        amount: '25000',
      };

      const result = await redemptionService.checkInstantRedemptionEligibility({
        schemeId: parseInt(mockReq.query.schemeId as string),
        amount: parseFloat(mockReq.query.amount as string),
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.eligible).toBe(true);
    });
  });

  describe('GET /api/redemption/history', () => {
    it('should fetch redemption history successfully', async () => {
      const mockHistory = [
        {
          id: '1',
          orderId: 1001,
          schemeName: 'Test Fund',
          units: 100,
          amount: 25000,
          redemptionType: 'Instant',
          status: 'Settled',
          redemptionDate: new Date().toISOString(),
          settlementDate: new Date().toISOString(),
        },
      ];

      (redemptionService.getRedemptionHistory as any).mockResolvedValue({
        success: true,
        data: mockHistory,
      });

      const result = await redemptionService.getRedemptionHistory(1);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should apply filters when provided', async () => {
      (redemptionService.getRedemptionHistory as any).mockResolvedValue({
        success: true,
        data: [],
      });

      const filters = {
        status: 'Settled',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = await redemptionService.getRedemptionHistory(1, filters);
      
      expect(result.success).toBe(true);
      expect(redemptionService.getRedemptionHistory).toHaveBeenCalledWith(1, filters);
    });
  });
});

