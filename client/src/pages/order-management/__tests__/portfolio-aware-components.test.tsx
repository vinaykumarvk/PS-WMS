/**
 * Portfolio-Aware Components Tests
 * Module B: Portfolio-Aware Ordering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PortfolioImpactPreview from '../components/portfolio-aware/portfolio-impact-preview';
import AllocationGapAnalysis from '../components/portfolio-aware/allocation-gap-analysis';
import RebalancingSuggestions from '../components/portfolio-aware/rebalancing-suggestions';
import HoldingsIntegration from '../components/portfolio-aware/holdings-integration';
import PortfolioSidebar from '../components/portfolio-sidebar';
import { usePortfolio, useImpactPreview, useAllocationGaps, useRebalancingSuggestions, useHoldings } from '../hooks/use-portfolio-analysis';

// Mock the hooks
vi.mock('../hooks/use-portfolio-analysis');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Portfolio-Aware Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PortfolioImpactPreview', () => {
    it('should render loading state', () => {
      (useImpactPreview as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const mockOrder = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Test Fund',
          transactionType: 'Purchase',
          amount: 100000,
        },
      ];

      render(
        <PortfolioImpactPreview clientId={1} order={mockOrder} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/calculating impact/i)).toBeInTheDocument();
    });

    it('should render impact preview data', async () => {
      const mockImpact = {
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
          {
            category: 'debt',
            change: -3,
            changePercent: -10,
            direction: 'decrease',
          },
        ],
        totalValueChange: 100000,
      };

      (useImpactPreview as any).mockReturnValue({
        data: mockImpact,
        isLoading: false,
        error: null,
      });

      const mockOrder = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Test Fund',
          transactionType: 'Purchase',
          amount: 100000,
        },
      ];

      render(
        <PortfolioImpactPreview clientId={1} order={mockOrder} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(/portfolio impact preview/i)).toBeInTheDocument();
        expect(screen.getByText(/equity/i)).toBeInTheDocument();
      });
    });

    it('should not render when clientId is null', () => {
      (useImpactPreview as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { container } = render(
        <PortfolioImpactPreview clientId={null} order={[]} />,
        { wrapper: createWrapper() }
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render error state', () => {
      (useImpactPreview as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to calculate impact'),
      });

      const mockOrder = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Test Fund',
          transactionType: 'Purchase',
          amount: 100000,
        },
      ];

      render(
        <PortfolioImpactPreview clientId={1} order={mockOrder} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/unable to calculate impact/i)).toBeInTheDocument();
    });
  });

  describe('AllocationGapAnalysis', () => {
    it('should render loading state', () => {
      (useAllocationGaps as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<AllocationGapAnalysis clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/analyzing your portfolio allocation/i)).toBeInTheDocument();
    });

    it('should render gaps when they exist', async () => {
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

      (useAllocationGaps as any).mockReturnValue({
        data: mockGaps,
        isLoading: false,
        error: null,
      });

      render(<AllocationGapAnalysis clientId={1} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/allocation gap analysis/i)).toBeInTheDocument();
      });
      
      // Check for equity category in the gaps (there might be multiple "equity" texts)
      expect(screen.getAllByText(/equity/i).length).toBeGreaterThan(0);
    });

    it('should show well-balanced message when no gaps', () => {
      const mockGaps = [
        {
          category: 'equity',
          current: 50,
          target: 50,
          gap: 0,
          recommendation: 'Equity allocation is optimal',
          priority: 'Low' as const,
        },
      ];

      (useAllocationGaps as any).mockReturnValue({
        data: mockGaps,
        isLoading: false,
        error: null,
      });

      render(<AllocationGapAnalysis clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/your portfolio is well-balanced/i)).toBeInTheDocument();
    });
  });

  describe('RebalancingSuggestions', () => {
    it('should render loading state', () => {
      (useRebalancingSuggestions as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<RebalancingSuggestions clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/analyzing rebalancing opportunities/i)).toBeInTheDocument();
    });

    it('should render suggestions when they exist', async () => {
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

      (useRebalancingSuggestions as any).mockReturnValue({
        data: mockSuggestions,
        isLoading: false,
        error: null,
      });

      render(<RebalancingSuggestions clientId={1} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/rebalancing suggestions/i)).toBeInTheDocument();
        expect(screen.getByText(/equity large cap fund/i)).toBeInTheDocument();
      });
    });

    it('should show no suggestions message when empty', () => {
      (useRebalancingSuggestions as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<RebalancingSuggestions clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/your portfolio is well-balanced/i)).toBeInTheDocument();
    });
  });

  describe('HoldingsIntegration', () => {
    it('should render loading state', () => {
      (useHoldings as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      (usePortfolio as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<HoldingsIntegration clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/loading your portfolio holdings/i)).toBeInTheDocument();
    });

    it('should render holdings table', async () => {
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

      (useHoldings as any).mockReturnValue({
        data: mockHoldings,
        isLoading: false,
        error: null,
      });

      (usePortfolio as any).mockReturnValue({
        data: {
          totalValue: 1000000,
        },
        isLoading: false,
        error: null,
      });

      render(<HoldingsIntegration clientId={1} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/your holdings/i)).toBeInTheDocument();
        expect(screen.getByText(/equity large cap fund/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no holdings', () => {
      (useHoldings as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      (usePortfolio as any).mockReturnValue({
        data: {
          totalValue: 0,
        },
        isLoading: false,
        error: null,
      });

      render(<HoldingsIntegration clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/no holdings found/i)).toBeInTheDocument();
    });
  });

  describe('PortfolioSidebar', () => {
    it('should render portfolio overview', async () => {
      const mockPortfolio = {
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

      (usePortfolio as any).mockReturnValue({
        data: mockPortfolio,
        isLoading: false,
        error: null,
      });

      (useAllocationGaps as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      (useRebalancingSuggestions as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      (useImpactPreview as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<PortfolioSidebar clientId={1} cartItems={[]} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/portfolio overview/i)).toBeInTheDocument();
        expect(screen.getByText(/total value/i)).toBeInTheDocument();
      });
    });

    it('should show message when clientId is null', () => {
      render(<PortfolioSidebar clientId={null} cartItems={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText(/select a client to view portfolio insights/i)).toBeInTheDocument();
    });
  });
});

