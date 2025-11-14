/**
 * Switch Hooks Tests
 * Module D: Advanced Switch Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useSwitchCalculation,
  usePartialSwitch,
  useMultiSchemeSwitch,
  useSwitchHistory,
  useSwitchRecommendations,
} from '../hooks/use-switch';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

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

describe('Switch Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSwitchCalculation', () => {
    it('should calculate switch successfully', async () => {
      const mockCalculation = {
        sourceScheme: 'Scheme 1',
        targetScheme: 'Scheme 2',
        sourceUnits: 3921.57,
        sourceNAV: 25.5,
        targetNAV: 28.3,
        switchAmount: 100000,
        targetUnits: 3462.89,
        exitLoad: 1.0,
        exitLoadAmount: 1000,
        netAmount: 99000,
        taxImplications: {
          shortTermGain: 0,
          longTermGain: 10000,
          taxAmount: 0,
        },
      };

      const mockResponse = {
        success: true,
        data: mockCalculation,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchCalculation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCalculation);
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/switch/calculate', {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      });
    });

    it('should handle calculation errors', async () => {
      const mockResponse = {
        success: false,
        message: 'Failed to calculate switch',
        errors: ['Invalid parameters'],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchCalculation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 100000,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Calculation failed',
          variant: 'destructive',
        })
      );
    });

    it('should calculate with units instead of amount', async () => {
      const mockCalculation = {
        sourceScheme: 'Scheme 1',
        targetScheme: 'Scheme 2',
        sourceUnits: 1000,
        sourceNAV: 25.5,
        targetNAV: 28.3,
        switchAmount: 25500,
        targetUnits: 901.06,
        exitLoad: 1.0,
        exitLoadAmount: 255,
        netAmount: 25245,
        taxImplications: {},
      };

      const mockResponse = {
        success: true,
        data: mockCalculation,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchCalculation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 1000,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/switch/calculate', {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 1000,
      });
    });
  });

  describe('usePartialSwitch', () => {
    it('should execute partial switch successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Partial switch executed successfully',
        data: {
          switchId: 1234567890,
          switchDate: new Date().toISOString(),
          status: 'Pending',
        },
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePartialSwitch(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Switch executed',
        })
      );
    });

    it('should handle partial switch errors', async () => {
      const mockResponse = {
        success: false,
        message: 'Insufficient balance',
        errors: ['Insufficient balance'],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePartialSwitch(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 50000,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Switch failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('useMultiSchemeSwitch', () => {
    it('should execute multi-scheme switch successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Multi-scheme switch executed successfully',
        data: {
          switchId: 1234567890,
          switchDate: new Date().toISOString(),
          status: 'Pending',
          targets: 2,
        },
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useMultiSchemeSwitch(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 50000 },
          { schemeId: 3, amount: 30000 },
        ],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Switch executed',
        })
      );
    });

    it('should handle multi-scheme switch errors', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid allocation',
        errors: ['Total allocation exceeds available amount'],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useMultiSchemeSwitch(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceSchemeId: 1,
        targets: [
          { schemeId: 2, amount: 100000 },
          { schemeId: 3, amount: 100000 },
        ],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Switch failed',
          variant: 'destructive',
        })
      );
    });
  });

  describe('useSwitchHistory', () => {
    it('should fetch switch history successfully', async () => {
      const mockHistory = [
        {
          id: 1,
          sourceScheme: 'Scheme 1',
          targetSchemes: ['Scheme 2'],
          amount: 50000,
          switchDate: new Date().toISOString(),
          status: 'Completed',
          type: 'Partial',
          exitLoad: 1.0,
          exitLoadAmount: 500,
          netAmount: 49500,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockHistory,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchHistory(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHistory);
      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('/api/switch/history')
      );
    });

    it('should not fetch when clientId is undefined', () => {
      const { result } = renderHook(() => useSwitchHistory(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(apiRequest).not.toHaveBeenCalled();
    });

    it('should apply filters when provided', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(
        () => useSwitchHistory(1, { status: 'Completed', type: 'Partial' }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('status=Completed')
      );
      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('type=Partial')
      );
    });

    it('should handle empty history', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchHistory(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useSwitchRecommendations', () => {
    it('should fetch switch recommendations successfully', async () => {
      const mockRecommendations = [
        {
          fromScheme: 'Large Cap Equity Fund',
          toScheme: 'Multi Cap Equity Fund',
          reason: 'Better diversification',
          expectedBenefit: 'Potential 2-3% higher returns',
          riskLevel: 'Low' as const,
        },
      ];

      const mockResponse = {
        success: true,
        data: mockRecommendations,
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchRecommendations(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecommendations);
      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/switch/recommendations?clientId=1'
      );
    });

    it('should not fetch when clientId is undefined', () => {
      const { result } = renderHook(() => useSwitchRecommendations(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(apiRequest).not.toHaveBeenCalled();
    });

    it('should handle empty recommendations', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      (apiRequest as any).mockResolvedValue({
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSwitchRecommendations(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      (apiRequest as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSwitchRecommendations(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});

