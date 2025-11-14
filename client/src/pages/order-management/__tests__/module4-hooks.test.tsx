/**
 * Module 4: Smart Suggestions Hooks Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSmartSuggestions } from '../hooks/use-smart-suggestions';
import { api } from '@/lib/api-client';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
  },
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

describe('useSmartSuggestions Hook', () => {
  const mockSuggestions = [
    {
      id: 'suggestion-1',
      type: 'amount_optimization' as const,
      title: 'Consider SIP Instead',
      description: 'Consider setting up a SIP.',
      priority: 'medium' as const,
      action: {
        label: 'Set Up SIP',
        type: 'apply' as const,
        data: { suggestedAmount: 10000 },
      },
    },
    {
      id: 'suggestion-2',
      type: 'timing_suggestion' as const,
      title: 'Market Status',
      description: 'Market is currently closed.',
      priority: 'high' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSuggestions', () => {
    it('should fetch suggestions on mount when autoFetch is true', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: {
              portfolioId: 'portfolio-123',
              currentOrder: {
                fundId: 'fund-123',
                amount: 10000,
                transactionType: 'purchase',
              },
            },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.post).toHaveBeenCalledWith('/api/suggestions/generate', {
        portfolioId: 'portfolio-123',
        currentOrder: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      });

      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch suggestions when autoFetch is false', async () => {
      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            autoFetch: false,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.post).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });

    it('should not fetch suggestions when enabled is false', async () => {
      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            enabled: false,
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('dismissSuggestion', () => {
    it('should remove suggestion from list', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.suggestions.length;
      result.current.dismissSuggestion('suggestion-1');

      expect(result.current.suggestions.length).toBe(initialCount - 1);
      expect(result.current.suggestions.find(s => s.id === 'suggestion-1')).toBeUndefined();
    });
  });

  describe('applySuggestion', () => {
    it('should return suggestion action data', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      const suggestion = result.current.suggestions.find(s => s.id === 'suggestion-1');
      if (suggestion) {
        const data = result.current.applySuggestion(suggestion);
        expect(data).toEqual({ suggestedAmount: 10000 });
      }
    });

    it('should return undefined for suggestion without action', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      const suggestion = result.current.suggestions.find(s => s.id === 'suggestion-2');
      if (suggestion) {
        const data = result.current.applySuggestion(suggestion);
        expect(data).toBeUndefined();
      }
    });
  });

  describe('refreshSuggestions', () => {
    it('should refetch suggestions', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = vi.mocked(api.post).mock.calls.length;

      result.current.refreshSuggestions();

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.suggestions).toEqual([]);
    });

    it('should handle API response with success: false', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: false,
          error: 'Failed to generate suggestions',
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            context: { portfolioId: 'portfolio-123' },
            autoFetch: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('manual fetchSuggestions', () => {
    it('should allow manual fetching with custom context', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockSuggestions,
        },
      } as any);

      const { result } = renderHook(
        () =>
          useSmartSuggestions({
            autoFetch: false,
          }),
        { wrapper: createWrapper() }
      );

      const customContext = {
        portfolioId: 'portfolio-456',
        currentOrder: {
          fundId: 'fund-456',
          amount: 20000,
          transactionType: 'redemption' as const,
        },
      };

      await result.current.fetchSuggestions(customContext);

      expect(api.post).toHaveBeenCalledWith('/api/suggestions/generate', customContext);
      expect(result.current.suggestions).toEqual(mockSuggestions);
    });
  });
});

