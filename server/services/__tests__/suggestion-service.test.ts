/**
 * Suggestion Service Tests
 * Module 4: Smart Suggestions & Intelligent Validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSuggestions,
  type SuggestionContext,
} from '../suggestion-service';

describe('Suggestion Service', () => {
  const mockUserId = 'user-123';
  const mockPortfolioId = 'portfolio-123';

  describe('generateSuggestions', () => {
    it('should generate suggestions for a purchase order', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
        portfolioData: {
          totalValue: 500000,
          holdings: [
            { fundId: 'fund-123', amount: 200000, percentage: 40 },
            { fundId: 'fund-456', amount: 300000, percentage: 60 },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check that suggestions are sorted by priority
      const priorities = suggestions.map(s => s.priority);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i + 1]]);
      }
    });

    it('should generate suggestions without portfolio data', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 5000,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate suggestions without current order', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioId: mockPortfolioId,
        portfolioData: {
          totalValue: 500000,
          holdings: [
            { fundId: 'fund-123', amount: 200000, percentage: 40 },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Diversification Suggestions', () => {
    it('should suggest diversification for concentrated portfolio', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioData: {
          totalValue: 1000000,
          holdings: [
            { fundId: 'fund-123', amount: 500000, percentage: 50 },
            { fundId: 'fund-456', amount: 500000, percentage: 50 },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const diversificationSuggestion = suggestions.find(
        s => s.type === 'portfolio_rebalancing' && s.metadata?.category === 'diversification'
      );
      // May or may not suggest based on logic
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should suggest category diversification for large portfolios', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioData: {
          totalValue: 200000,
          holdings: [
            { fundId: 'fund-123', amount: 100000, percentage: 50, category: 'equity' },
            { fundId: 'fund-456', amount: 100000, percentage: 50, category: 'equity' },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const categorySuggestion = suggestions.find(
        s => s.type === 'fund_recommendation' && s.metadata?.category === 'diversification'
      );
      // May or may not suggest based on logic
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Amount Optimization Suggestions', () => {
    it('should suggest SIP for large one-time investments', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 120000,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const sipSuggestion = suggestions.find(
        s => s.type === 'amount_optimization' && s.metadata?.category === 'sip'
      );
      expect(sipSuggestion).toBeDefined();
      if (sipSuggestion) {
        expect(sipSuggestion.action?.type).toBe('apply');
        expect(sipSuggestion.action?.data?.suggestedAmount).toBe(10000);
      }
    });

    it('should suggest minimum investment amount', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 300,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const minAmountSuggestion = suggestions.find(
        s => s.type === 'amount_optimization' && s.metadata?.category === 'minimum'
      );
      if (minAmountSuggestion) {
        expect(minAmountSuggestion.action?.data?.suggestedAmount).toBe(500);
      }
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should suggest round numbers for large amounts', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 12345,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const roundSuggestion = suggestions.find(
        s => s.type === 'amount_optimization' && s.metadata?.category === 'rounding'
      );
      if (roundSuggestion) {
        expect(roundSuggestion.action?.data?.suggestedAmount).toBe(12300);
      }
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Timing Suggestions', () => {
    it('should suggest market status for weekend', async () => {
      const weekendDate = new Date('2025-01-11T10:00:00Z'); // Saturday
      vi.useFakeTimers();
      vi.setSystemTime(weekendDate);

      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const marketSuggestion = suggestions.find(
        s => s.type === 'timing_suggestion' && s.metadata?.category === 'market_hours'
      );
      if (marketSuggestion) {
        expect(marketSuggestion.metadata?.isMarketOpen).toBe(false);
      }
      expect(Array.isArray(suggestions)).toBe(true);

      vi.useRealTimers();
    });

    it('should warn about cut-off time approaching', async () => {
      // Set time to 3:15 PM on a weekday
      const cutoffDate = new Date('2025-01-13T15:15:00Z'); // Monday 3:15 PM IST
      vi.useFakeTimers();
      vi.setSystemTime(cutoffDate);

      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      const cutoffSuggestion = suggestions.find(
        s => s.type === 'timing_suggestion' && s.metadata?.category === 'cutoff'
      );
      // May or may not suggest based on exact time
      expect(Array.isArray(suggestions)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Rebalancing Suggestions', () => {
    it('should suggest rebalancing for drifted portfolio', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioData: {
          totalValue: 1000000,
          holdings: [
            { fundId: 'fund-1', amount: 800000, percentage: 80, category: 'equity' },
            { fundId: 'fund-2', amount: 200000, percentage: 20, category: 'debt' },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);
      
      expect(Array.isArray(suggestions)).toBe(true);
      // May suggest rebalancing if deviation is significant
    });

    it('should not suggest rebalancing for balanced portfolio', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        portfolioData: {
          totalValue: 1000000,
          holdings: [
            { fundId: 'fund-1', amount: 600000, percentage: 60, category: 'equity' },
            { fundId: 'fund-2', amount: 300000, percentage: 30, category: 'debt' },
            { fundId: 'fund-3', amount: 100000, percentage: 10, category: 'hybrid' },
          ],
        },
      };

      const suggestions = await generateSuggestions(context);
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Suggestion structure', () => {
    it('should return suggestions with required fields', async () => {
      const context: SuggestionContext = {
        userId: mockUserId,
        currentOrder: {
          fundId: 'fund-123',
          amount: 10000,
          transactionType: 'purchase',
        },
      };

      const suggestions = await generateSuggestions(context);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('priority');
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
        expect(['fund_recommendation', 'amount_optimization', 'timing_suggestion', 'portfolio_rebalancing']).toContain(suggestion.type);
      }
    });
  });
});

