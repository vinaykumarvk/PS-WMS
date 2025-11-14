/**
 * Switch Service Tests
 * Module D: Advanced Switch Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateSwitch,
  executePartialSwitch,
  executeMultiSchemeSwitch,
  getSwitchHistory,
  getSwitchRecommendations,
} from '../switch-service';

describe('Switch Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSwitch', () => {
    it('should calculate switch with amount', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      };

      const result = await calculateSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.switchAmount).toBe(100000);
      expect(result.data?.sourceScheme).toBe('Scheme 1');
      expect(result.data?.targetScheme).toBe('Scheme 2');
      expect(result.data?.exitLoadAmount).toBeGreaterThan(0);
      expect(result.data?.netAmount).toBeLessThan(100000);
      expect(result.data?.taxImplications).toBeDefined();
    });

    it('should calculate switch with units', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 1000,
      };

      const result = await calculateSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.sourceUnits).toBe(1000);
      expect(result.data?.switchAmount).toBeGreaterThan(0);
      expect(result.data?.targetUnits).toBeGreaterThan(0);
    });

    it('should reject when neither amount nor units provided', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
      } as any;

      const result = await calculateSwitch(params);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Either amount or units must be provided');
    });

    it('should reject when sourceSchemeId is missing', async () => {
      const params = {
        targetSchemeId: 2,
        amount: 100000,
      } as any;

      const result = await calculateSwitch(params);

      expect(result.success).toBe(false);
    });

    it('should include tax implications in calculation', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      };

      const result = await calculateSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data?.taxImplications).toBeDefined();
      expect(result.data?.taxImplications?.shortTermGain !== undefined || 
             result.data?.taxImplications?.longTermGain !== undefined).toBe(true);
    });

    it('should calculate exit load correctly', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      };

      const result = await calculateSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data?.exitLoad).toBeGreaterThan(0);
      expect(result.data?.exitLoadAmount).toBeGreaterThan(0);
      expect(result.data?.netAmount).toBe(result.data!.switchAmount - result.data!.exitLoadAmount);
    });
  });

  describe('executePartialSwitch', () => {
    it('should execute partial switch with amount', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      };

      const result = await executePartialSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.switchId).toBeDefined();
      expect(result.data?.status).toBe('Pending');
    });

    it('should execute partial switch with units', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 500,
      };

      const result = await executePartialSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject when neither amount nor units provided', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
      } as any;

      const result = await executePartialSwitch(params);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Either amount or units must be provided');
    });

    it('should store switch in history', async () => {
      const params = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      };

      await executePartialSwitch(params);

      // Verify history was stored
      const historyResult = await getSwitchHistory(1);
      expect(historyResult.success).toBe(true);
      expect(historyResult.data?.length).toBeGreaterThan(0);
    });
  });

  describe('executeMultiSchemeSwitch', () => {
    it('should execute multi-scheme switch successfully', async () => {
      const params = {
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 50000 },
          { schemeId: 3, amount: 30000 },
        ],
      };

      const result = await executeMultiSchemeSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.switchId).toBeDefined();
      expect(result.data?.targets).toBe(2);
    });

    it('should reject when no targets provided', async () => {
      const params = {
        sourceSchemeId: 1,
        targets: [],
      };

      const result = await executeMultiSchemeSwitch(params);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('At least one target scheme must be provided');
    });

    it('should reject when targets is not an array', async () => {
      const params = {
        sourceSchemeId: 1,
        targets: null,
      } as any;

      const result = await executeMultiSchemeSwitch(params);

      expect(result.success).toBe(false);
    });

    it('should reject when total amount is zero', async () => {
      const params = {
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 0 },
        ],
      };

      const result = await executeMultiSchemeSwitch(params);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Total switch amount must be greater than zero');
    });

    it('should support percentage-based allocation', async () => {
      const params = {
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 50000, percentage: 62.5 },
          { schemeId: 3, amount: 30000, percentage: 37.5 },
        ],
      };

      const result = await executeMultiSchemeSwitch(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getSwitchHistory', () => {
    beforeEach(async () => {
      // Clear history before each test
      const clientId = 1;
      // Execute a switch to create some history
      await executePartialSwitch({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      });
    });

    it('should fetch switch history for a client', async () => {
      const result = await getSwitchHistory(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter history by status', async () => {
      const result = await getSwitchHistory(1, { status: 'Pending' });

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        result.data.forEach((item: any) => {
          expect(item.status).toBe('Pending');
        });
      }
    });

    it('should filter history by type', async () => {
      const result = await getSwitchHistory(1, { type: 'Partial' });

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        result.data.forEach((item: any) => {
          expect(item.type).toBe('Partial');
        });
      }
    });

    it('should filter history by date range', async () => {
      const dateFrom = new Date('2024-01-01').toISOString();
      const dateTo = new Date().toISOString();

      const result = await getSwitchHistory(1, { dateFrom, dateTo });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return empty array for client with no history', async () => {
      const result = await getSwitchHistory(99999);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should sort history by date descending', async () => {
      // Create multiple switches
      await executePartialSwitch({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 10000,
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      await executePartialSwitch({
        sourceSchemeId: 1,
        targetSchemeId: 3,
        amount: 20000,
      });

      const result = await getSwitchHistory(1);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 1) {
        const dates = result.data.map((item: any) => new Date(item.switchDate).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  describe('getSwitchRecommendations', () => {
    it('should fetch switch recommendations for a client', async () => {
      const result = await getSwitchRecommendations(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return recommendations with required fields', async () => {
      const result = await getSwitchRecommendations(1);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        result.data.forEach((rec: any) => {
          expect(rec.fromScheme).toBeDefined();
          expect(rec.toScheme).toBeDefined();
          expect(rec.reason).toBeDefined();
          expect(rec.expectedBenefit).toBeDefined();
          expect(rec.riskLevel).toBeDefined();
          expect(['Low', 'Medium', 'High']).toContain(rec.riskLevel);
        });
      }
    });

    it('should handle client with no recommendations', async () => {
      // This test verifies the function doesn't crash
      const result = await getSwitchRecommendations(99999);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});

