import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';

export interface Suggestion {
  id: string;
  type: 'fund_recommendation' | 'amount_optimization' | 'timing_suggestion' | 'portfolio_rebalancing';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    type: 'apply' | 'dismiss' | 'learn_more';
    data?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface SuggestionContext {
  portfolioId?: string;
  currentOrder?: {
    fundId: string;
    amount: number;
    transactionType: 'purchase' | 'redemption' | 'switch';
  };
  portfolioData?: {
    totalValue: number;
    holdings: Array<{
      fundId: string;
      amount: number;
      percentage: number;
    }>;
  };
}

export interface UseSmartSuggestionsOptions {
  context?: SuggestionContext;
  autoFetch?: boolean;
  enabled?: boolean;
}

export function useSmartSuggestions(options: UseSmartSuggestionsOptions = {}) {
  const { context, autoFetch = true, enabled = true } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuggestions = useCallback(async (suggestionContext?: SuggestionContext) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{ success: boolean; data: Suggestion[] }>(
        '/api/suggestions/generate',
        suggestionContext || context
      );

      if (response.data.success) {
        setSuggestions(response.data.data);
      } else {
        throw new Error('Failed to fetch suggestions');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [context, enabled]);

  useEffect(() => {
    if (autoFetch && enabled) {
      fetchSuggestions();
    }
  }, [autoFetch, enabled, fetchSuggestions]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  const applySuggestion = useCallback((suggestion: Suggestion) => {
    return suggestion.action?.data;
  }, []);

  const refreshSuggestions = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    dismissSuggestion,
    applySuggestion,
    refreshSuggestions,
  };
}

