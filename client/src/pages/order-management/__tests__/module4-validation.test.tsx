/**
 * Module 4: Validation Components Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ConflictDetector } from '../components/validation/conflict-detector';
import { MarketHoursIndicator } from '../components/validation/market-hours-indicator';
import { PortfolioLimitWarning } from '../components/validation/portfolio-limit-warning';
import { EnhancedValidation } from '../components/validation/enhanced-validation';
import type { ValidationMessage } from '../components/validation/enhanced-validation';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Validation Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConflictDetector', () => {
    const mockOrder = {
      fundId: 'fund-123',
      amount: 10000,
      transactionType: 'purchase' as const,
      orderType: 'lump_sum' as const,
    };

    it('should render conflict detector', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      } as any);

      render(
        <ConflictDetector
          order={mockOrder}
          portfolioId="portfolio-123"
        />
      );

      // Component should render without errors
      expect(screen.queryByText(/Checking for conflicts/)).not.toBeInTheDocument();
    });

    it('should check conflicts when order changes', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      } as any);

      const { rerender } = render(
        <ConflictDetector
          order={mockOrder}
          portfolioId="portfolio-123"
        />
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });

      // Update order
      rerender(
        <ConflictDetector
          order={{ ...mockOrder, amount: 20000 }}
          portfolioId="portfolio-123"
        />
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(2);
      });
    });

    it('should display conflicts', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              type: 'duplicate_order',
              severity: 'warning',
              message: 'A similar order was placed recently.',
            },
          ],
        },
      } as any);

      render(
        <ConflictDetector
          order={mockOrder}
          portfolioId="portfolio-123"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/A similar order was placed recently/)).toBeInTheDocument();
      });
    });

    it('should call onConflictsChange callback', async () => {
      const { api } = await import('@/lib/api-client');
      const onConflictsChange = vi.fn();
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              type: 'duplicate_order',
              severity: 'warning',
              message: 'Duplicate order detected.',
            },
          ],
        },
      } as any);

      render(
        <ConflictDetector
          order={mockOrder}
          portfolioId="portfolio-123"
          onConflictsChange={onConflictsChange}
        />
      );

      await waitFor(() => {
        expect(onConflictsChange).toHaveBeenCalled();
      });
    });

    it('should allow dismissing conflicts', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              type: 'duplicate_order',
              severity: 'warning',
              message: 'Duplicate order detected.',
            },
          ],
        },
      } as any);

      render(
        <ConflictDetector
          order={mockOrder}
          portfolioId="portfolio-123"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Duplicate order detected/)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/Duplicate order detected/)).not.toBeInTheDocument();
      });
    });
  });

  describe('MarketHoursIndicator', () => {
    it('should render market hours indicator', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            isMarketOpen: true,
            isBeforeCutOff: true,
            marketHours: {
              open: '09:00',
              close: '15:30',
              cutOff: '15:30',
            },
            minutesUntilCutOff: 30,
            nextTradingDay: new Date().toISOString(),
            timezone: 'IST',
          },
        },
      } as any);

      render(<MarketHoursIndicator />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/market-hours');
      });
    });

    it('should display market open status', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            isMarketOpen: true,
            isBeforeCutOff: true,
            marketHours: {
              open: '09:00',
              close: '15:30',
              cutOff: '15:30',
            },
            minutesUntilCutOff: 30,
            nextTradingDay: new Date().toISOString(),
            timezone: 'IST',
          },
        },
      } as any);

      render(<MarketHoursIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/Market is Open/i)).toBeInTheDocument();
      });
    });

    it('should display market closed status', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            isMarketOpen: false,
            isBeforeCutOff: false,
            marketHours: {
              open: '09:00',
              close: '15:30',
              cutOff: '15:30',
            },
            minutesUntilCutOff: null,
            nextTradingDay: new Date().toISOString(),
            timezone: 'IST',
          },
        },
      } as any);

      render(<MarketHoursIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/Market is Closed/i)).toBeInTheDocument();
      });
    });

    it('should display compact view', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            isMarketOpen: true,
            isBeforeCutOff: true,
            marketHours: {
              open: '09:00',
              close: '15:30',
              cutOff: '15:30',
            },
            minutesUntilCutOff: 30,
            nextTradingDay: new Date().toISOString(),
            timezone: 'IST',
          },
        },
      } as any);

      render(<MarketHoursIndicator compact={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Market Open/i)).toBeInTheDocument();
      });
    });
  });

  describe('PortfolioLimitWarning', () => {
    it('should check portfolio limits', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      } as any);

      render(
        <PortfolioLimitWarning
          portfolioId="portfolio-123"
          newOrderAmount={10000}
          fundId="fund-123"
        />
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/validation/portfolio-limits',
          {
            portfolioId: 'portfolio-123',
            newOrderAmount: 10000,
            fundId: 'fund-123',
          }
        );
      });
    });

    it('should display limit warnings', async () => {
      const { api } = await import('@/lib/api-client');
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              type: 'single_fund_limit',
              current: 500000,
              limit: 400000,
              percentage: 125,
              message: 'This investment would exceed the recommended limit.',
            },
          ],
        },
      } as any);

      render(
        <PortfolioLimitWarning
          portfolioId="portfolio-123"
          newOrderAmount={100000}
          fundId="fund-123"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/exceed the recommended limit/)).toBeInTheDocument();
      });
    });

    it('should call onLimitsChange callback', async () => {
      const { api } = await import('@/lib/api-client');
      const onLimitsChange = vi.fn();
      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              type: 'single_fund_limit',
              current: 500000,
              limit: 400000,
              percentage: 125,
              message: 'Limit exceeded.',
            },
          ],
        },
      } as any);

      render(
        <PortfolioLimitWarning
          portfolioId="portfolio-123"
          newOrderAmount={100000}
          fundId="fund-123"
          onLimitsChange={onLimitsChange}
        />
      );

      await waitFor(() => {
        expect(onLimitsChange).toHaveBeenCalled();
      });
    });
  });

  describe('EnhancedValidation', () => {
    const mockMessages: ValidationMessage[] = [
      {
        id: 'msg-1',
        message: 'This is an error',
        severity: 'error',
        field: 'amount',
      },
      {
        id: 'msg-2',
        message: 'This is a warning',
        severity: 'warning',
      },
      {
        id: 'msg-3',
        message: 'This is info',
        severity: 'info',
      },
      {
        id: 'msg-4',
        message: 'This is success',
        severity: 'success',
      },
    ];

    it('should render validation messages', () => {
      render(<EnhancedValidation messages={mockMessages} />);

      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.getByText('This is a warning')).toBeInTheDocument();
      expect(screen.getByText('This is info')).toBeInTheDocument();
    });

    it('should not show success messages by default', () => {
      render(<EnhancedValidation messages={mockMessages} />);

      expect(screen.queryByText('This is success')).not.toBeInTheDocument();
    });

    it('should show success messages when showSuccess is true', () => {
      render(<EnhancedValidation messages={mockMessages} showSuccess={true} />);

      expect(screen.getByText('This is success')).toBeInTheDocument();
    });

    it('should render inline messages', () => {
      render(<EnhancedValidation messages={mockMessages} inline={true} />);

      expect(screen.getByText('This is an error')).toBeInTheDocument();
    });

    it('should render empty when no messages', () => {
      const { container } = render(<EnhancedValidation messages={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });
});

