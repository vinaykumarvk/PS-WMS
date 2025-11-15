/**
 * Analytics Dashboard Tests
 * Module 8: Analytics Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsDashboard from '../../analytics-dashboard';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';

global.fetch = vi.fn();

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

const resolveJson = (data: unknown) => Promise.resolve({ ok: true, json: async () => data });

const setupSuccessfulFetchMocks = () => {
  (global.fetch as vi.Mock).mockImplementation((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url;

    if (url.includes('/api/analytics/orders')) {
      return resolveJson(mockOrderAnalytics);
    }

    if (url.includes('/api/analytics/performance')) {
      return resolveJson(mockPerformanceMetrics);
    }

    if (url.includes('/api/analytics/clients')) {
      return resolveJson(mockClientInsights);
    }

    if (url.includes('/api/auth')) {
      return resolveJson({ user: { id: 1 } });
    }

    return resolveJson({});
  });
};

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

  describe('Page Load', () => {
    it('should render analytics dashboard', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByText(/analytics dashboard/i);
    });

    it('should display filter panel', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      const filterHeadings = await screen.findAllByText(/filters/i);
      expect(filterHeadings.length).toBeGreaterThan(0);
    });

    it('should surface KPI recommendations after filters', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByText(/kpi opportunity engine/i);
      const confidenceBadges = await screen.findAllByText(/confidence/i);
      expect(confidenceBadges.length).toBeGreaterThan(0);
    });

    it('should display tabs', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByRole('tab', { name: /order analytics/i });
      await screen.findByRole('tab', { name: /performance metrics/i });
      await screen.findByRole('tab', { name: /client insights/i });
    });
  });

  describe('Order Analytics Tab', () => {
    it('should display order analytics when tab is selected', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('order-analytics-content')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should display order summary cards', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await waitFor(() => {
        const panel = screen.queryByTestId('order-analytics-content');
        expect(panel).toBeTruthy();
        expect(panel).toHaveTextContent(/total value/i);
        expect(panel).toHaveTextContent(/average order/i);
        expect(panel).toHaveTextContent(/order volume at/i);
      }, { timeout: 3000 });
      expect((await screen.findAllByText(/comparative insights/i)).length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Tab', () => {
    it('should display performance metrics when tab is selected', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByTestId('order-analytics-content');
      const performanceTab = await screen.findByRole('tab', { name: /performance metrics/i });
      const user = userEvent.setup();
      await user.click(performanceTab);
      await waitFor(() => {
        expect(performanceTab).toHaveAttribute('data-state', 'active');
      });

      const performancePanel = await screen.findByTestId('performance-metrics-content', undefined, { timeout: 3000 });
      expect(performancePanel).toBeTruthy();
      expect(performancePanel).toHaveTextContent(/total aum/i);
    });
  });

  describe('Client Insights Tab', () => {
    it('should display client insights when tab is selected', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByTestId('order-analytics-content');
      const clientsTab = await screen.findByRole('tab', { name: /client insights/i });
      const user = userEvent.setup();
      await user.click(clientsTab);
      await waitFor(() => {
        expect(clientsTab).toHaveAttribute('data-state', 'active');
      });

      const clientPanel = await screen.findByTestId('client-insights-content', undefined, { timeout: 3000 });
      expect(clientPanel).toBeTruthy();
      expect(clientPanel).toHaveTextContent(/total clients/i);
    });
  });

  describe('Filtering', () => {
    it('should allow date range selection', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      const startDateInput = await screen.findByLabelText(/start date/i);
      expect(startDateInput).toBeInTheDocument();
    });

    it('should allow quick date range selection', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByText(/quick date range/i);
    });

    it('should allow status filtering', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      const statusMatches = await screen.findAllByText(/status/i);
      expect(statusMatches.some((node) => node.textContent?.trim().toLowerCase() === 'status')).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    it('should display export options', async () => {
      setupSuccessfulFetchMocks();

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByText(/export analytics data/i);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching data', async () => {
      setupSuccessfulFetchMocks();
      (global.fetch as vi.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<AnalyticsDashboard />);

      // Component should render even while loading
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      setupSuccessfulFetchMocks();
      (global.fetch as vi.Mock)
        .mockImplementationOnce(() => resolveJson({ user: { id: 1 } }))
        .mockImplementationOnce(() => Promise.reject(new Error('API Error')));

      renderWithProviders(<AnalyticsDashboard />);

      await screen.findByText(/analytics dashboard/i);
    });
  });
});

