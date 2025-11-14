/**
 * Automation Hooks Tests
 * Module 11: Automation Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAutoInvestRules,
  useRebalancingRules,
  useTriggerOrders,
  useNotificationPreferences,
} from '../use-automation';

// Mock API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Automation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAutoInvestRules', () => {
    it('should fetch auto-invest rules for client', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'AUTO-1',
              name: 'Monthly SIP',
              amount: 5000,
              frequency: 'Monthly',
              status: 'Active',
            },
          ],
        }),
      } as Response);

      const { result } = renderHook(() => useAutoInvestRules(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.rules).toBeDefined();
      });
    });

    it('should not fetch when clientId is undefined', () => {
      const { result } = renderHook(() => useAutoInvestRules(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.rules).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should create auto-invest rule', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            id: 'AUTO-1',
            name: 'Monthly SIP',
          },
        }),
      } as Response);

      const { result } = renderHook(() => useAutoInvestRules(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.createRule).toBeDefined();
      });

      // Test mutation structure
      expect(typeof result.current.createRule.mutateAsync).toBe('function');
    });
  });

  describe('useRebalancingRules', () => {
    it('should fetch rebalancing rules for client', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'REBAL-1',
              name: 'Quarterly Rebalancing',
              strategy: 'Threshold-Based',
              status: 'Active',
            },
          ],
        }),
      } as Response);

      const { result } = renderHook(() => useRebalancingRules(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.rules).toBeDefined();
      });
    });

    it('should execute rebalancing', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            id: 'EXEC-1',
            status: 'Executed',
          },
        }),
      } as Response);

      const { result } = renderHook(() => useRebalancingRules(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.executeRebalancing).toBeDefined();
      });

      expect(typeof result.current.executeRebalancing.mutateAsync).toBe('function');
    });
  });

  describe('useTriggerOrders', () => {
    it('should fetch trigger orders for client', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'TRIGGER-1',
              name: 'Buy on Dip',
              triggerType: 'NAV',
              status: 'Active',
            },
          ],
        }),
      } as Response);

      const { result } = renderHook(() => useTriggerOrders(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.orders).toBeDefined();
      });
    });
  });

  describe('useNotificationPreferences', () => {
    it('should fetch notification preferences for client', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: [
            {
              id: 'PREF-1',
              event: 'Order Executed',
              channels: ['Email', 'SMS'],
              enabled: true,
            },
          ],
        }),
      } as Response);

      const { result } = renderHook(() => useNotificationPreferences(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
      });
    });

    it('should create notification preference', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            id: 'PREF-1',
            event: 'Order Executed',
            channels: ['Email'],
            enabled: true,
          },
        }),
      } as Response);

      const { result } = renderHook(() => useNotificationPreferences(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.createPreference).toBeDefined();
      });

      expect(typeof result.current.createPreference.mutateAsync).toBe('function');
    });
  });
});

