/**
 * Module 4: Smart Suggestions Components Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SuggestionCard } from '../components/smart-suggestions/suggestion-card';
import { SuggestionList } from '../components/smart-suggestions/suggestion-list';
import { AIRecommendations } from '../components/smart-suggestions/ai-recommendations';
import type { Suggestion } from '../hooks/use-smart-suggestions';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Smart Suggestions Components', () => {
  const mockSuggestion: Suggestion = {
    id: 'suggestion-1',
    type: 'amount_optimization',
    title: 'Consider SIP Instead',
    description: 'Instead of a one-time investment, consider setting up a SIP for better rupee cost averaging.',
    priority: 'medium',
    action: {
      label: 'Set Up SIP',
      type: 'apply',
      data: { suggestedAmount: 10000 },
    },
    metadata: { category: 'sip' },
  };

  const mockHighPrioritySuggestion: Suggestion = {
    id: 'suggestion-2',
    type: 'timing_suggestion',
    title: 'Cut-off Time Approaching',
    description: 'Place your order within 15 minutes to get today\'s NAV.',
    priority: 'high',
    metadata: { category: 'cutoff', minutesRemaining: 15 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SuggestionCard', () => {
    it('should render suggestion card with all fields', () => {
      const onDismiss = vi.fn();
      const onApply = vi.fn();

      render(
        <SuggestionCard
          suggestion={mockSuggestion}
          onDismiss={onDismiss}
          onApply={onApply}
        />
      );

      expect(screen.getByText('Consider SIP Instead')).toBeInTheDocument();
      expect(screen.getByText(/Instead of a one-time investment/)).toBeInTheDocument();
      expect(screen.getByText('Amount Optimization')).toBeInTheDocument();
      expect(screen.getByText('Set Up SIP')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      const onApply = vi.fn();

      render(
        <SuggestionCard
          suggestion={mockSuggestion}
          onDismiss={onDismiss}
          onApply={onApply}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith('suggestion-1');
    });

    it('should call onApply when apply button is clicked', () => {
      const onDismiss = vi.fn();
      const onApply = vi.fn();

      render(
        <SuggestionCard
          suggestion={mockSuggestion}
          onDismiss={onDismiss}
          onApply={onApply}
        />
      );

      const applyButton = screen.getByText('Set Up SIP');
      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledWith(mockSuggestion);
    });

    it('should render high priority suggestion with correct styling', () => {
      render(<SuggestionCard suggestion={mockHighPrioritySuggestion} />);

      const card = screen.getByText('Cut-off Time Approaching').closest('.border-red-200');
      expect(card).toBeInTheDocument();
    });

    it('should render suggestion without action', () => {
      const suggestionWithoutAction: Suggestion = {
        ...mockSuggestion,
        action: undefined,
      };

      render(<SuggestionCard suggestion={suggestionWithoutAction} />);

      expect(screen.getByText('Consider SIP Instead')).toBeInTheDocument();
      expect(screen.queryByText('Set Up SIP')).not.toBeInTheDocument();
    });
  });

  describe('SuggestionList', () => {
    it('should render list of suggestions', () => {
      const suggestions = [mockSuggestion, mockHighPrioritySuggestion];

      render(<SuggestionList suggestions={suggestions} />);

      expect(screen.getByText('Cut-off Time Approaching')).toBeInTheDocument();
      expect(screen.getByText('Consider SIP Instead')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<SuggestionList suggestions={[]} loading={true} />);

      expect(screen.getByText(/Loading suggestions/)).toBeInTheDocument();
    });

    it('should show empty message when no suggestions', () => {
      render(<SuggestionList suggestions={[]} />);

      expect(screen.getByText(/No suggestions available/)).toBeInTheDocument();
    });

    it('should group suggestions by priority', () => {
      const suggestions = [
        mockHighPrioritySuggestion,
        mockSuggestion,
        { ...mockSuggestion, id: 'suggestion-3', priority: 'low' as const },
      ];

      render(<SuggestionList suggestions={suggestions} />);

      // High priority should appear first
      const highPriority = screen.getByText('Cut-off Time Approaching');
      expect(highPriority).toBeInTheDocument();
    });

    it('should call onDismiss when suggestion is dismissed', () => {
      const onDismiss = vi.fn();

      render(
        <SuggestionList
          suggestions={[mockSuggestion]}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith('suggestion-1');
    });
  });

  describe('AIRecommendations', () => {
    it('should render AI recommendations component', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [mockSuggestion],
        },
      } as any);

      render(<AIRecommendations />);

      await waitFor(() => {
        expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
      });
    });

    it('should fetch suggestions on mount', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [mockSuggestion],
        },
      } as any);

      render(<AIRecommendations />);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/suggestions/generate',
          expect.any(Object)
        );
      });
    });

    it('should handle refresh button click', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [mockSuggestion],
        },
      } as any);

      render(<AIRecommendations />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle suggestion apply', async () => {
      const { api } = await import('@/lib/api-client');
      const onSuggestionApply = vi.fn();
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [mockSuggestion],
        },
      } as any);

      render(<AIRecommendations onSuggestionApply={onSuggestionApply} />);

      await waitFor(() => {
        expect(screen.getByText('Set Up SIP')).toBeInTheDocument();
      });

      const applyButton = screen.getByText('Set Up SIP');
      fireEvent.click(applyButton);

      expect(onSuggestionApply).toHaveBeenCalled();
    });

    it('should display error message on fetch failure', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      render(<AIRecommendations />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load suggestions/)).toBeInTheDocument();
      });
    });
  });
});

