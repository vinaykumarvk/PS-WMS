/**
 * Portfolio Analysis Hooks Tests
 * Module B: Portfolio-Aware Ordering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  usePortfolio,
  useImpactPreview,
  useAllocationGaps,
  useRebalancingSuggestions,
  useHoldings,
} from '../hooks/use-portfolio-analysis';
import { apiRequest } from '@/lib/queryClient';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient as any}>{children}</QueryClientProvider>
  );
};

describe('Portfolio Analysis Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePortfolio', () => {
    it('should fetch portfolio data successfully', async () => {
      const mockPortfolioData = {
        totalValue: 1000000,
        totalInvested: 950000,
        totalGainLoss: 50000,
        totalGainLossPercent: 5.26,
        allocation: {
          equity: 50,
          debt: 30,
          hybrid: 20,
          others: 0,
        },
        holdings: [],
        lastUpdated: new Date().toISOString(),
      };

      const mockResponse = {
        success: true,
        data: mockPortfolioData,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePortfolio(1, false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPortfolioData);
      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/portfolio/current-allocation?clientId=1&includeHoldings=false'
      );
    });

    it('should not fetch when clientId is null', () => {
      const { result } = renderHook(() => usePortfolio(null, false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(apiRequest).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        success: false,
        message: 'Failed to fetch portfolio',
        errors: ['Client not found'],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePortfolio(1, false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useImpactPreview', () => {
    it('should calculate impact preview successfully', async () => {
      const mockOrder = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Test Fund',
          transactionType: 'Purchase',
          amount: 100000,
        },
      ];

      const mockImpactData = {
        beforeAllocation: {
          equity: 50,
          debt: 30,
          hybrid: 20,
          others: 0,
        },
        afterAllocation: {
          equity: 55,
          debt: 27,
          hybrid: 18,
          others: 0,
        },
        changes: [
          {
            category: 'equity',
            change: 5,
            changePercent: 10,
            direction: 'increase',
          },
        ],
        totalValueChange: 100000,
      };

      const mockResponse = {
        success: true,
        data: mockImpactData,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useImpactPreview(1, mockOrder), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockImpactData);
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/portfolio/impact-preview', {
        clientId: 1,
        order: mockOrder,
      });
    });

    it('should not fetch when order is empty', () => {
      const { result } = renderHook(() => useImpactPreview(1, []), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(apiRequest).not.toHaveBeenCalled();
    });
  });

  describe('useAllocationGaps', () => {
    it('should fetch allocation gaps successfully', async () => {
      const mockGaps = [
        {
          category: 'equity',
          current: 50,
          target: 60,
          gap: 10,
          recommendation: 'Increase equity allocation by 10%',
          priority: 'High' as const,
        },
        {
          category: 'debt',
          current: 30,
          target: 30,
          gap: 0,
          recommendation: 'Debt allocation is optimal',
          priority: 'Low' as const,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockGaps,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAllocationGaps(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGaps);
    });

    it('should fetch allocation gaps with custom target', async () => {
      const customTarget = {
        equity: 70,
        debt: 20,
        hybrid: 10,
        others: 0,
      };

      const mockResponse = {
        success: true,
        data: [],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAllocationGaps(1, customTarget), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('targetAllocation')
      );
    });
  });

  describe('useRebalancingSuggestions', () => {
    it('should fetch rebalancing suggestions successfully', async () => {
      const mockSuggestions = [
        {
          id: '1',
          action: 'Buy' as const,
          toScheme: 'Equity Large Cap Fund',
          toSchemeId: 101,
          amount: 100000,
          reason: 'Increase equity allocation',
          priority: 'High' as const,
          expectedImpact: 'Will bring equity allocation from 50% to 60%',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockSuggestions,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useRebalancingSuggestions(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSuggestions);
    });
  });

  describe('useHoldings', () => {
    it('should fetch holdings successfully', async () => {
      const mockHoldings = [
        {
          id: 1,
          productId: 101,
          schemeName: 'Equity Large Cap Fund',
          category: 'equity',
          units: 10000,
          nav: 50,
          currentValue: 500000,
          investedAmount: 450000,
          gainLoss: 50000,
          gainLossPercent: 11.11,
          purchaseDate: new Date().toISOString(),
        },
      ];

      const mockResponse = {
        success: true,
        data: mockHoldings,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useHoldings(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHoldings);
    });

    it('should filter holdings by scheme ID', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useHoldings(1, 101), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('schemeId=101')
      );
    });
  });
});

