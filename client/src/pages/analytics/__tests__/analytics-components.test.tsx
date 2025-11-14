/**
 * Analytics Components Tests
 * Module 8: Analytics Dashboard
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderAnalyticsComponent } from '../components/order-analytics';
import { PerformanceMetricsComponent } from '../components/performance-metrics';
import { ClientInsightsComponent } from '../components/client-insights';
import { ExportOptionsComponent } from '../components/export-options';
import { OrderAnalytics, PerformanceMetrics, ClientInsights } from '../types/analytics.types';

describe('Analytics Components', () => {
  describe('OrderAnalyticsComponent', () => {
    const mockData: OrderAnalytics = {
      totalOrders: 150,
      totalValue: 5000000,
      averageOrderValue: 33333.33,
      ordersByStatus: [
        { status: 'completed', count: 100, value: 4000000 },
        { status: 'pending', count: 50, value: 1000000 },
      ],
      ordersByType: [],
      ordersByClient: [],
      ordersByProduct: [],
      ordersOverTime: [],
      topClients: [],
      topProducts: [],
    };

    it('should render loading state', () => {
      render(<OrderAnalyticsComponent data={undefined} isLoading={true} />);
      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should render with data', () => {
      render(<OrderAnalyticsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total orders/i)).toBeInTheDocument();
    });

    it('should display summary cards', () => {
      render(<OrderAnalyticsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total orders/i)).toBeInTheDocument();
      expect(screen.getByText(/total value/i)).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      render(<OrderAnalyticsComponent data={undefined} isLoading={false} />);
      expect(screen.getByText(/no order analytics data available/i)).toBeInTheDocument();
    });
  });

  describe('PerformanceMetricsComponent', () => {
    const mockData: PerformanceMetrics = {
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
      trends: [],
    };

    it('should render loading state', () => {
      render(<PerformanceMetricsComponent data={undefined} isLoading={true} />);
      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should render with data', () => {
      render(<PerformanceMetricsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total aum/i)).toBeInTheDocument();
    });

    it('should display KPI cards', () => {
      render(<PerformanceMetricsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total aum/i)).toBeInTheDocument();
      expect(screen.getByText(/total clients/i)).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      render(<PerformanceMetricsComponent data={undefined} isLoading={false} />);
      expect(screen.getByText(/no performance metrics data available/i)).toBeInTheDocument();
    });
  });

  describe('ClientInsightsComponent', () => {
    const mockData: ClientInsights = {
      totalClients: 50,
      activeClients: 42,
      newClients: 5,
      clientsByTier: [],
      clientsByRiskProfile: [],
      clientAcquisitionTrend: [],
      clientRetentionRate: 85.5,
      averageClientValue: 2000000,
      topClients: [],
      clientSegmentation: {
        byAUM: [],
        byActivity: [],
      },
    };

    it('should render loading state', () => {
      render(<ClientInsightsComponent data={undefined} isLoading={true} />);
      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should render with data', () => {
      render(<ClientInsightsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total clients/i)).toBeInTheDocument();
    });

    it('should display summary cards', () => {
      render(<ClientInsightsComponent data={mockData} isLoading={false} />);
      expect(screen.getByText(/total clients/i)).toBeInTheDocument();
      expect(screen.getByText(/active clients/i)).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      render(<ClientInsightsComponent data={undefined} isLoading={false} />);
      expect(screen.getByText(/no client insights data available/i)).toBeInTheDocument();
    });
  });

  describe('ExportOptionsComponent', () => {
    const mockOrderAnalytics: OrderAnalytics = {
      totalOrders: 150,
      totalValue: 5000000,
      averageOrderValue: 33333.33,
      ordersByStatus: [],
      ordersByType: [],
      ordersByClient: [],
      ordersByProduct: [],
      ordersOverTime: [],
      topClients: [],
      topProducts: [],
    };

    it('should render export options', () => {
      render(
        <ExportOptionsComponent
          orderAnalytics={mockOrderAnalytics}
          performanceMetrics={undefined}
          clientInsights={undefined}
        />
      );
      expect(screen.getByText(/export analytics data/i)).toBeInTheDocument();
    });

    it('should display export buttons for order analytics', () => {
      render(
        <ExportOptionsComponent
          orderAnalytics={mockOrderAnalytics}
          performanceMetrics={undefined}
          clientInsights={undefined}
        />
      );
      expect(screen.getByText(/order analytics/i)).toBeInTheDocument();
    });

    it('should handle no data', () => {
      render(
        <ExportOptionsComponent
          orderAnalytics={undefined}
          performanceMetrics={undefined}
          clientInsights={undefined}
        />
      );
      expect(screen.getByText(/no data available for export/i)).toBeInTheDocument();
    });
  });
});

