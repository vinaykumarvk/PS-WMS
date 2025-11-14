/**
 * Redemption Hooks Tests
 * Module E: Instant Redemption Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useCalculateRedemption,
  useCheckInstantRedemptionEligibility,
  useExecuteInstantRedemption,
  useExecuteRedemption,
  useRedemptionHistory,
} from '../hooks/use-redemption';
import { apiRequest } from '@/lib/queryClient';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('Redemption Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCalculateRedemption', () => {
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

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: mockCalculation,
        }),
      });

      const { result } = renderHook(() => useCalculateRedemption(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        schemeId: 1,
        amount: 2550,
        redemptionType: 'Standard',
      });

      expect(mutationResult).toEqual(mockCalculation);
      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/redemption/calculate',
        expect.objectContaining({
          schemeId: 1,
          amount: 2550,
        })
      );
    });

    it('should handle calculation errors', async () => {
      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: false,
          message: 'Calculation failed',
        }),
      });

      const { result } = renderHook(() => useCalculateRedemption(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          schemeId: 1,
          amount: 2550,
        })
      ).rejects.toThrow();
    });
  });

  describe('useCheckInstantRedemptionEligibility', () => {
    it('should check eligibility successfully', async () => {
      const mockEligibility = {
        eligible: true,
        maxAmount: 50000,
        availableAmount: 50000,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: mockEligibility,
        }),
      });

      const { result } = renderHook(() => useCheckInstantRedemptionEligibility(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        schemeId: 1,
        amount: 25000,
      });

      expect(mutationResult).toEqual(mockEligibility);
      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/redemption/eligibility?schemeId=1&amount=25000'
      );
    });

    it('should return not eligible for amount exceeding limit', async () => {
      const mockEligibility = {
        eligible: false,
        maxAmount: 50000,
        availableAmount: 50000,
        reason: 'Amount exceeds limit',
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: mockEligibility,
        }),
      });

      const { result } = renderHook(() => useCheckInstantRedemptionEligibility(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        schemeId: 1,
        amount: 60000,
      });

      expect(mutationResult.eligible).toBe(false);
    });
  });

  describe('useExecuteInstantRedemption', () => {
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

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            cartItem: mockCartItem,
          },
        }),
      });

      const { result } = renderHook(() => useExecuteInstantRedemption(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        schemeId: 1,
        amount: 25000,
      });

      expect(mutationResult.cartItem).toEqual(mockCartItem);
      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/redemption/instant',
        expect.objectContaining({
          schemeId: 1,
          amount: 25000,
        })
      );
    });

    it('should handle execution errors', async () => {
      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: false,
          message: 'Execution failed',
        }),
      });

      const { result } = renderHook(() => useExecuteInstantRedemption(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          schemeId: 1,
          amount: 25000,
        })
      ).rejects.toThrow();
    });
  });

  describe('useExecuteRedemption', () => {
    it('should execute standard redemption successfully', async () => {
      const mockCartItem = {
        id: 'redemption-1',
        productId: 1,
        schemeName: 'Test Fund',
        transactionType: 'Redemption',
        amount: 10000,
        nav: 25.50,
        units: 392.16,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            cartItem: mockCartItem,
          },
        }),
      });

      const { result } = renderHook(() => useExecuteRedemption(), {
        wrapper: createWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        schemeId: 1,
        amount: 10000,
        redemptionType: 'Standard',
      });

      expect(mutationResult.cartItem).toEqual(mockCartItem);
    });
  });

  describe('useRedemptionHistory', () => {
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

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: mockHistory,
        }),
      });

      const { result } = renderHook(() => useRedemptionHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHistory);
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/redemption/history');
    });

    it('should apply filters when provided', async () => {
      const mockHistory: any[] = [];

      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: mockHistory,
        }),
      });

      const { result } = renderHook(
        () =>
          useRedemptionHistory({
            status: 'Settled',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('/api/redemption/history')
      );
    });

    it('should handle empty history', async () => {
      (apiRequest as any).mockResolvedValue({
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { result } = renderHook(() => useRedemptionHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });
});

