/**
 * Integration tests for SIP Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSIP,
  getSIPById,
  getSIPsByClient,
  pauseSIP,
  resumeSIP,
  modifySIP,
  cancelSIP,
  calculateSIP,
  getSIPCalendar,
  getSIPPerformance,
} from '../services/sip-service';
import { db } from '../db';
import { sipPlans, products } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('SIP Service', () => {
  const testClientId = 1;
  const testSchemeId = 1;
  let createdPlanId: string;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(sipPlans).where(eq(sipPlans.clientId, testClientId));
  });

  afterEach(async () => {
    // Clean up test data
    if (createdPlanId) {
      await db.delete(sipPlans).where(eq(sipPlans.id, createdPlanId));
    }
  });

  describe('createSIP', () => {
    it('should create a SIP plan successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      expect(plan).toBeDefined();
      expect(plan.id).toMatch(/^SIP-\d{8}-[A-Z0-9]{5}$/);
      expect(plan.clientId).toBe(testClientId);
      expect(plan.schemeId).toBe(testSchemeId);
      expect(plan.amount).toBe(5000);
      expect(plan.frequency).toBe('Monthly');
      expect(plan.status).toBe('Active');
    });

    it('should reject SIP with past start date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: yesterdayStr,
        installments: 12,
      };

      await expect(createSIP(testClientId, sipData)).rejects.toThrow(
        'Start date must be a future date'
      );
    });

    it('should reject SIP with amount less than ₹1,000', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 500,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      await expect(createSIP(testClientId, sipData)).rejects.toThrow(
        'SIP amount must be at least ₹1,000'
      );
    });
  });

  describe('getSIPById', () => {
    it('should retrieve SIP plan by ID', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const createdPlan = await createSIP(testClientId, sipData);
      createdPlanId = createdPlan.id;

      const retrievedPlan = await getSIPById(createdPlan.id);

      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.id).toBe(createdPlan.id);
      expect(retrievedPlan?.amount).toBe(5000);
    });

    it('should return null for non-existent plan', async () => {
      const result = await getSIPById('NON-EXISTENT-ID');
      expect(result).toBeNull();
    });
  });

  describe('getSIPsByClient', () => {
    it('should retrieve all SIP plans for a client', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData1 = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const sipData2 = {
        schemeId: testSchemeId,
        amount: 10000,
        frequency: 'Quarterly' as const,
        startDate: tomorrowStr,
        installments: 4,
      };

      const plan1 = await createSIP(testClientId, sipData1);
      const plan2 = await createSIP(testClientId, sipData2);
      createdPlanId = plan1.id;

      const plans = await getSIPsByClient(testClientId);

      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.some((p) => p.id === plan1.id)).toBe(true);
      expect(plans.some((p) => p.id === plan2.id)).toBe(true);
    });

    it('should filter by status', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const activePlans = await getSIPsByClient(testClientId, 'Active');
      expect(activePlans.some((p) => p.id === plan.id)).toBe(true);

      const pausedPlans = await getSIPsByClient(testClientId, 'Paused');
      expect(pausedPlans.some((p) => p.id === plan.id)).toBe(false);
    });
  });

  describe('pauseSIP', () => {
    it('should pause an active SIP plan', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const pausedPlan = await pauseSIP(plan.id);

      expect(pausedPlan.status).toBe('Paused');
      expect(pausedPlan.pausedAt).toBeDefined();
    });

    it('should reject pausing non-active plan', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      await pauseSIP(plan.id);

      await expect(pauseSIP(plan.id)).rejects.toThrow(
        'Can only pause active SIP plans'
      );
    });
  });

  describe('resumeSIP', () => {
    it('should resume a paused SIP plan', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      await pauseSIP(plan.id);
      const resumedPlan = await resumeSIP(plan.id);

      expect(resumedPlan.status).toBe('Active');
      expect(resumedPlan.pausedAt).toBeUndefined();
    });
  });

  describe('modifySIP', () => {
    it('should modify SIP amount', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const modifiedPlan = await modifySIP(plan.id, { newAmount: 10000 });

      expect(modifiedPlan.amount).toBe(10000);
    });

    it('should modify SIP frequency', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const modifiedPlan = await modifySIP(plan.id, { newFrequency: 'Quarterly' });

      expect(modifiedPlan.frequency).toBe('Quarterly');
    });
  });

  describe('cancelSIP', () => {
    it('should cancel a SIP plan', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const cancelledPlan = await cancelSIP(plan.id, 'No longer needed');

      expect(cancelledPlan.status).toBe('Cancelled');
      expect(cancelledPlan.cancellationReason).toBe('No longer needed');
      expect(cancelledPlan.cancelledAt).toBeDefined();
    });
  });

  describe('calculateSIP', () => {
    it('should calculate SIP returns', async () => {
      const input = {
        amount: 5000,
        frequency: 'Monthly' as const,
        duration: 12,
        expectedReturn: 12,
      };

      const result = await calculateSIP(input);

      expect(result).toBeDefined();
      expect(result.totalInvested).toBeGreaterThan(0);
      expect(result.expectedValue).toBeGreaterThan(result.totalInvested);
      expect(result.estimatedReturns).toBeGreaterThan(0);
      expect(result.monthlyBreakdown).toHaveLength(12);
    });
  });

  describe('getSIPPerformance', () => {
    it('should return performance data for a SIP plan', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const sipData = {
        schemeId: testSchemeId,
        amount: 5000,
        frequency: 'Monthly' as const,
        startDate: tomorrowStr,
        installments: 12,
      };

      const plan = await createSIP(testClientId, sipData);
      createdPlanId = plan.id;

      const performance = await getSIPPerformance(plan.id);

      expect(performance).toBeDefined();
      expect(performance.planId).toBe(plan.id);
      expect(performance.totalInvested).toBeGreaterThanOrEqual(0);
      expect(performance.vsLumpSum).toBeDefined();
    });
  });
});

