/**
 * Analytics Dashboard Tests
 * Module 8: Analytics Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsDashboard from '../../analytics-dashboard';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';

global.fetch = vi.fn();

describe('Analytics Dashboard - Module 8', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    window.location.hash = '#/analytics';
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>{component}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  const mockOrderAnalytics = {
    totalOrders: 150,
    totalValue: 5000000,
    averageOrderValue: 33333.33,
    ordersByStatus: [
      { status: 'completed', count: 100, value: 4000000 },
      { status: 'pending', count: 50, value: 1000000 },
    ],
    ordersByType: [
      { type: 'Purchase', count: 120, value: 4500000 },
      { type: 'Redemption', count: 30, value: 500000 },
    ],
    ordersByClient: [],
    ordersByProduct: [],
    ordersOverTime: [
      { date: '2024-01-01', count: 10, value: 300000 },
      { date: '2024-01-02', count: 15, value: 450000 },
    ],
    topClients: [
      { clientId: 1, clientName: 'Client 1', orderCount: 20, totalValue: 1000000 },
    ],
    topProducts: [
      { productId: 1, productName: 'Product 1', orderCount: 30, totalValue: 1500000 },
    ],
  };

  const mockPerformanceMetrics = {
    totalAUM: 100000000,
    totalClients: 50,
    totalOrders: 150,
    totalRevenue: 5000000,
    averageOrderValue: 33333.33,
    clientRetentionRate: 85.5,
    orderSuccessRate: 92.0,
    averageClientValue: 2000000,
    growthMetrics: {
      aumGrowth: 15.5,
      clientGrowth: 10.0,
      orderGrowth: 20.0,
      revenueGrowth: 18.5,
    },
    trends: [
      { period: '2024-01', aum: 10000000, clients: 45, orders: 12, revenue: 400000 },
      { period: '2024-02', aum: 11000000, clients: 47, orders: 15, revenue: 450000 },
    ],
  };

  const mockClientInsights = {
    totalClients: 50,
    activeClients: 42,
    newClients: 5,
    clientsByTier: [
      { tier: 'silver', count: 20, aum: 20000000 },
      { tier: 'gold', count: 25, aum: 50000000 },
      { tier: 'platinum', count: 5, aum: 30000000 },
    ],
    clientsByRiskProfile: [
      { riskProfile: 'conservative', count: 15 },
      { riskProfile: 'moderate', count: 25 },
      { riskProfile: 'aggressive', count: 10 },
    ],
    clientAcquisitionTrend: [
      { period: '2024-01', count: 3 },
      { period: '2024-02', count: 2 },
    ],
    clientRetentionRate: 85.5,
    averageClientValue: 2000000,
    topClients: [
      { clientId: 1, clientName: 'Client 1', aum: 5000000, orderCount: 20, lastOrderDate: '2024-01-15' },
    ],
    clientSegmentation: {
      byAUM: [
        { range: '< ₹1L', count: 5 },
        { range: '₹1L - ₹5L', count: 20 },
        { range: '₹5L - ₹10L', count: 15 },
        { range: '₹10L - ₹50L', count: 8 },
        { range: '> ₹50L', count: 2 },
      ],
      byActivity: [
        { activity: 'Active', count: 30 },
        { activity: 'Moderate', count: 12 },
        { activity: 'Inactive', count: 8 },
      ],
    },
  };

  describe('Page Load', () => {
    it('should render analytics dashboard', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display filter panel', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/filters/i)).toBeInTheDocument();
      });
    });

    it('should display tabs', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/order analytics/i)).toBeInTheDocument();
        expect(screen.getByText(/performance metrics/i)).toBeInTheDocument();
        expect(screen.getByText(/client insights/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Analytics Tab', () => {
    it('should display order analytics when tab is selected', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/total orders/i)).toBeInTheDocument();
      });
    });

    it('should display order summary cards', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/total orders/i)).toBeInTheDocument();
        expect(screen.getByText(/total value/i)).toBeInTheDocument();
        expect(screen.getByText(/average order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics Tab', () => {
    it('should display performance metrics when tab is selected', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      const performanceTab = screen.getByText(/performance metrics/i);
      fireEvent.click(performanceTab);

      await waitFor(() => {
        expect(screen.getByText(/total aum/i)).toBeInTheDocument();
      });
    });
  });

  describe('Client Insights Tab', () => {
    it('should display client insights when tab is selected', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      const clientsTab = screen.getByText(/client insights/i);
      fireEvent.click(clientsTab);

      await waitFor(() => {
        expect(screen.getByText(/total clients/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should allow date range selection', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/start date/i);
        expect(startDateInput).toBeInTheDocument();
      });
    });

    it('should allow quick date range selection', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/quick date range/i)).toBeInTheDocument();
      });
    });

    it('should allow status filtering', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should display export options', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/export analytics data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching data', async () => {
      (global.fetch as any)
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolves
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOrderAnalytics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPerformanceMetrics })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClientInsights });

      renderWithProviders(<AnalyticsDashboard />);

      // Component should render even while loading
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 1 } }) })
        .mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        // Component should still render
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });
  });
});

