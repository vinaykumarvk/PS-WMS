/**
 * Analytics Types
 * Type definitions for analytics data
 */

export type BenchmarkValueFormat = 'number' | 'currency' | 'percent';

export interface AnalyticsNarrative {
  headline: string;
  summary: string;
  supportingPoints: string[];
}

export interface BenchmarkInsight {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  variance: number;
  direction: 'above' | 'below' | 'on_track';
  format: BenchmarkValueFormat;
  narrative?: string;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'efficiency' | 'retention' | 'revenue' | 'compliance';
  evidence: string[];
}

export interface OrderAnalytics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  ordersByStatus: Array<{ status: string; count: number; value: number }>;
  ordersByType: Array<{ type: string; count: number; value: number }>;
  ordersByClient: Array<{ clientId: number; clientName: string; count: number; value: number }>;
  ordersByProduct: Array<{ productId: number; productName: string; count: number; value: number }>;
  ordersOverTime: Array<{ date: string; count: number; value: number }>;
  topClients: Array<{ clientId: number; clientName: string; orderCount: number; totalValue: number }>;
  topProducts: Array<{ productId: number; productName: string; orderCount: number; totalValue: number }>;
  narrative?: AnalyticsNarrative;
  benchmarks?: BenchmarkInsight[];
}

export interface PerformanceMetrics {
  totalAUM: number;
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  clientRetentionRate: number;
  orderSuccessRate: number;
  averageClientValue: number;
  growthMetrics: {
    aumGrowth: number;
    clientGrowth: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  trends: Array<{
    period: string;
    aum: number;
    clients: number;
    orders: number;
    revenue: number;
  }>;
  narrative?: AnalyticsNarrative;
  benchmarks?: BenchmarkInsight[];
}

export interface ClientInsights {
  totalClients: number;
  activeClients: number;
  newClients: number;
  clientsByTier: Array<{ tier: string; count: number; aum: number }>;
  clientsByRiskProfile: Array<{ riskProfile: string; count: number }>;
  clientAcquisitionTrend: Array<{ period: string; count: number }>;
  clientRetentionRate: number;
  averageClientValue: number;
  topClients: Array<{
    clientId: number;
    clientName: string;
    aum: number;
    orderCount: number;
    lastOrderDate: string;
  }>;
  clientSegmentation: {
    byAUM: Array<{ range: string; count: number }>;
    byActivity: Array<{ activity: string; count: number }>;
  };
  narrative?: AnalyticsNarrative;
  benchmarks?: BenchmarkInsight[];
}

