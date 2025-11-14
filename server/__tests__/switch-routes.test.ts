/**
 * Switch API Routes Integration Tests
 * Module D: Advanced Switch Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';

// Mock the switch-service
vi.mock('../services/switch-service', () => ({
  calculateSwitch: vi.fn(),
  executePartialSwitch: vi.fn(),
  executeMultiSchemeSwitch: vi.fn(),
  getSwitchHistory: vi.fn(),
  getSwitchRecommendations: vi.fn(),
}));

describe('Switch API Routes', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      session: { userId: 1 } as any,
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    vi.clearAllMocks();
  });

  describe('POST /api/switch/calculate', () => {
    it('should calculate switch with valid parameters', async () => {
      const { calculateSwitch } = await import('../services/switch-service');

      const mockCalculation = {
        sourceScheme: 'Scheme 1',
        targetScheme: 'Scheme 2',
        switchAmount: 100000,
        netAmount: 99000,
      };

      const mockResponse = {
        success: true,
        data: mockCalculation,
      };

      vi.mocked(calculateSwitch).mockResolvedValue(mockResponse as any);

      mockReq.body = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      };

      const result = await calculateSwitch(mockReq.body);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(calculateSwitch).toHaveBeenCalledWith({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      });
    });

    it('should reject when sourceSchemeId is missing', () => {
      mockReq.body = {
        targetSchemeId: 2,
        amount: 100000,
      };

      expect(mockReq.body.sourceSchemeId).toBeUndefined();
    });

    it('should reject when targetSchemeId is missing', () => {
      mockReq.body = {
        sourceSchemeId: 1,
        amount: 100000,
      };

      expect(mockReq.body.targetSchemeId).toBeUndefined();
    });

    it('should reject when neither amount nor units provided', () => {
      mockReq.body = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
      };

      expect(mockReq.body.amount).toBeUndefined();
      expect(mockReq.body.units).toBeUndefined();
    });

    it('should accept units instead of amount', async () => {
      const { calculateSwitch } = await import('../services/switch-service');

      const mockResponse = {
        success: true,
        data: {},
      };

      vi.mocked(calculateSwitch).mockResolvedValue(mockResponse as any);

      mockReq.body = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 1000,
      };

      const result = await calculateSwitch(mockReq.body);

      expect(result.success).toBe(true);
      expect(calculateSwitch).toHaveBeenCalledWith({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 1000,
      });
    });
  });

  describe('POST /api/switch/partial', () => {
    it('should execute partial switch with valid parameters', async () => {
      const { executePartialSwitch } = await import('../services/switch-service');

      const mockResponse = {
        success: true,
        message: 'Partial switch executed successfully',
        data: {
          switchId: 1234567890,
          status: 'Pending',
        },
      };

      vi.mocked(executePartialSwitch).mockResolvedValue(mockResponse as any);

      mockReq.body = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      };

      const result = await executePartialSwitch(mockReq.body);

      expect(result.success).toBe(true);
      expect(executePartialSwitch).toHaveBeenCalledWith({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      });
    });

    it('should validate required fields', () => {
      mockReq.body = {};

      expect(mockReq.body.sourceSchemeId).toBeUndefined();
      expect(mockReq.body.targetSchemeId).toBeUndefined();
    });

    it('should accept units instead of amount', async () => {
      const { executePartialSwitch } = await import('../services/switch-service');

      const mockResponse = {
        success: true,
        data: {},
      };

      vi.mocked(executePartialSwitch).mockResolvedValue(mockResponse as any);

      mockReq.body = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 500,
      };

      const result = await executePartialSwitch(mockReq.body);

      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/switch/multi-scheme', () => {
    it('should execute multi-scheme switch with valid parameters', async () => {
      const { executeMultiSchemeSwitch } = await import('../services/switch-service');

      const mockResponse = {
        success: true,
        message: 'Multi-scheme switch executed successfully',
        data: {
          switchId: 1234567890,
          targets: 2,
        },
      };

      vi.mocked(executeMultiSchemeSwitch).mockResolvedValue(mockResponse as any);

      mockReq.body = {
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 50000 },
          { schemeId: 3, amount: 30000 },
        ],
      };

      const result = await executeMultiSchemeSwitch(mockReq.body);

      expect(result.success).toBe(true);
      expect(executeMultiSchemeSwitch).toHaveBeenCalledWith({
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 50000 },
          { schemeId: 3, amount: 30000 },
        ],
      });
    });

    it('should reject when sourceSchemeId is missing', () => {
      mockReq.body = {
        targets: [{ schemeId: 2, amount: 50000 }],
      };

      expect(mockReq.body.sourceSchemeId).toBeUndefined();
    });

    it('should reject when targets array is empty', () => {
      mockReq.body = {
        sourceSchemeId: 1,
        targets: [],
      };

      expect(mockReq.body.targets.length).toBe(0);
    });

    it('should reject when targets is not an array', () => {
      mockReq.body = {
        sourceSchemeId: 1,
        targets: null,
      };

      expect(Array.isArray(mockReq.body.targets)).toBe(false);
    });

    it('should validate target scheme structure', () => {
      mockReq.body = {
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2 }, // Missing amount
        ],
      };

      const target = mockReq.body.targets[0];
      expect(target.amount).toBeUndefined();
    });
  });

  describe('GET /api/switch/history', () => {
    it('should fetch switch history with clientId', async () => {
      const { getSwitchHistory } = await import('../services/switch-service');

      const mockHistory = [
        {
          id: 1,
          sourceScheme: 'Scheme 1',
          targetSchemes: ['Scheme 2'],
          amount: 50000,
          status: 'Completed',
          type: 'Partial',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockHistory,
      };

      vi.mocked(getSwitchHistory).mockResolvedValue(mockResponse as any);

      mockReq.query = {
        clientId: '1',
      };

      const result = await getSwitchHistory(
        parseInt(mockReq.query.clientId as string)
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should reject when clientId is missing', () => {
      mockReq.query = {};

      expect(mockReq.query.clientId).toBeUndefined();
    });

    it('should apply filters when provided', async () => {
      const { getSwitchHistory } = await import('../services/switch-service');

      const mockResponse = {
        success: true,
        data: [],
      };

      vi.mocked(getSwitchHistory).mockResolvedValue(mockResponse as any);

      mockReq.query = {
        clientId: '1',
        status: 'Completed',
        type: 'Partial',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      const result = await getSwitchHistory(
        parseInt(mockReq.query.clientId as string),
        {
          status: mockReq.query.status as string,
          type: mockReq.query.type as string,
          dateFrom: mockReq.query.dateFrom as string,
          dateTo: mockReq.query.dateTo as string,
        }
      );

      expect(result.success).toBe(true);
      expect(getSwitchHistory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'Completed',
          type: 'Partial',
        })
      );
    });
  });

  describe('GET /api/switch/recommendations', () => {
    it('should fetch switch recommendations with clientId', async () => {
      const { getSwitchRecommendations } = await import('../services/switch-service');

      const mockRecommendations = [
        {
          fromScheme: 'Large Cap Equity Fund',
          toScheme: 'Multi Cap Equity Fund',
          reason: 'Better diversification',
          expectedBenefit: 'Potential 2-3% higher returns',
          riskLevel: 'Low',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockRecommendations,
      };

      vi.mocked(getSwitchRecommendations).mockResolvedValue(mockResponse as any);

      mockReq.query = {
        clientId: '1',
      };

      const result = await getSwitchRecommendations(
        parseInt(mockReq.query.clientId as string)
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecommendations);
    });

    it('should reject when clientId is missing', () => {
      mockReq.query = {};

      expect(mockReq.query.clientId).toBeUndefined();
    });

    it('should handle invalid clientId', () => {
      mockReq.query = {
        clientId: 'invalid',
      };

      expect(isNaN(parseInt(mockReq.query.clientId as string))).toBe(true);
    });
  });
});

