/**
 * Automation Scheduler Service Tests
 * Module 11: Automation Features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as schedulerService from '../automation-scheduler-service';
import * as automationService from '../automation-service';

// Mock automation service
const mockExecuteAutoInvestRule = vi.fn();
const mockCheckRebalancingNeeded = vi.fn();
const mockCheckTriggerOrders = vi.fn();

vi.mock('../automation-service', () => ({
  executeAutoInvestRule: (...args: any[]) => mockExecuteAutoInvestRule(...args),
  checkRebalancingNeeded: (...args: any[]) => mockCheckRebalancingNeeded(...args),
  checkTriggerOrders: (...args: any[]) => mockCheckTriggerOrders(...args),
}));

describe('Automation Scheduler Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteAutoInvestRule.mockReset();
    mockCheckRebalancingNeeded.mockReset();
    mockCheckTriggerOrders.mockReset();
    // Stop scheduler if running
    schedulerService.stopScheduler();
  });

  afterEach(() => {
    schedulerService.stopScheduler();
  });

  describe('Scheduler Control', () => {
    it('should start scheduler', () => {
      schedulerService.startScheduler();
      expect(schedulerService.isSchedulerRunning()).toBe(true);
      schedulerService.stopScheduler();
    });

    it('should stop scheduler', () => {
      schedulerService.startScheduler();
      schedulerService.stopScheduler();
      expect(schedulerService.isSchedulerRunning()).toBe(false);
    });

    it('should not start scheduler if already running', () => {
      schedulerService.startScheduler();
      const initialStatus = schedulerService.isSchedulerRunning();
      
      // Try to start again
      schedulerService.startScheduler();
      
      expect(schedulerService.isSchedulerRunning()).toBe(initialStatus);
      schedulerService.stopScheduler();
    });

    it('should check scheduler status', () => {
      expect(schedulerService.isSchedulerRunning()).toBe(false);
      
      schedulerService.startScheduler();
      expect(schedulerService.isSchedulerRunning()).toBe(true);
      
      schedulerService.stopScheduler();
      expect(schedulerService.isSchedulerRunning()).toBe(false);
    });
  });

  describe('Manual Execution', () => {
    describe('manualExecuteAutoInvest', () => {
      it('should execute auto-invest rule', async () => {
        const ruleId = 'AUTO-20250101-12345';
        
        mockExecuteAutoInvestRule.mockResolvedValue({
          success: true,
          orderId: 'ORD-123',
        });

        const result = await schedulerService.manualExecuteAutoInvest(ruleId);

        expect(result.success).toBe(true);
        expect(result.message).toContain('executed successfully');
        expect(mockExecuteAutoInvestRule).toHaveBeenCalledWith(ruleId);
      });

      it('should handle execution failure', async () => {
        const ruleId = 'AUTO-20250101-12345';
        
        mockExecuteAutoInvestRule.mockResolvedValue({
          success: false,
          error: 'Insufficient funds',
        });

        const result = await schedulerService.manualExecuteAutoInvest(ruleId);

        expect(result.success).toBe(false);
        // Message should contain the error or "Failed"
        expect(result.message).toMatch(/Failed|Insufficient funds/);
      });
    });

    describe('manualCheckRebalancing', () => {
      it('should check if rebalancing is needed', async () => {
        const ruleId = 'REBAL-20250101-12345';
        
        mockCheckRebalancingNeeded.mockResolvedValue(true);

        const result = await schedulerService.manualCheckRebalancing(ruleId);

        expect(result.needsRebalancing).toBe(true);
        expect(mockCheckRebalancingNeeded).toHaveBeenCalledWith(ruleId);
      });

      it('should return false when rebalancing not needed', async () => {
        const ruleId = 'REBAL-20250101-12345';
        
        mockCheckRebalancingNeeded.mockResolvedValue(false);

        const result = await schedulerService.manualCheckRebalancing(ruleId);

        expect(result.needsRebalancing).toBe(false);
      });
    });

    describe('manualCheckTriggers', () => {
      it('should check trigger orders', async () => {
        const clientId = 1;
        const mockTriggeredOrders = [
          {
            id: 'TRIGGER-1',
            name: 'Buy on Dip',
            status: 'Executed',
          },
        ];
        
        mockCheckTriggerOrders.mockResolvedValue(mockTriggeredOrders as any);

        const result = await schedulerService.manualCheckTriggers(clientId);

        expect(result.triggered).toBe(1);
        expect(mockCheckTriggerOrders).toHaveBeenCalledWith(clientId);
      });

      it('should check all trigger orders when clientId not provided', async () => {
        mockCheckTriggerOrders.mockResolvedValue([]);

        const result = await schedulerService.manualCheckTriggers();

        expect(result.triggered).toBe(0);
        expect(mockCheckTriggerOrders).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Scheduler Loop', () => {
    it('should process all automation types', async () => {
      mockCheckTriggerOrders.mockResolvedValue([]);

      // Mock console.log to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await schedulerService.processAutoInvestRules();
      await schedulerService.processRebalancingRules();
      await schedulerService.processTriggerOrders();

      expect(mockCheckTriggerOrders).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in scheduler loop', async () => {
      mockCheckTriggerOrders.mockRejectedValue(
        new Error('Database error')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(schedulerService.processTriggerOrders()).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});

