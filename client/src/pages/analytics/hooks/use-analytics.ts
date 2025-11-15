/**
 * Analytics Hook
 * Custom hook for fetching analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { OrderAnalytics, PerformanceMetrics, ClientInsights } from '../types/analytics.types';
import {
  enrichClientInsights,
  enrichOrderAnalytics,
  enrichPerformanceMetrics,
} from '../utils/insight-generators';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  productId?: number;
  status?: string;
  transactionType?: string;
}

/**
 * Hook to fetch order analytics
 */
export function useOrderAnalytics(filters?: AnalyticsFilters) {
  return useQuery<OrderAnalytics>({
    queryKey: ['/api/analytics/orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.clientId) params.append('clientId', filters.clientId.toString());
      if (filters?.productId) params.append('productId', filters.productId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.transactionType) params.append('transactionType', filters.transactionType);

      const response = await fetch(`/api/analytics/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order analytics');
      }
      const payload = (await response.json()) as OrderAnalytics;
      return enrichOrderAnalytics(payload);
    },
  });
}

/**
 * Hook to fetch performance metrics
 */
export function usePerformanceMetrics(filters?: AnalyticsFilters) {
  return useQuery<PerformanceMetrics>({
    queryKey: ['/api/analytics/performance', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.clientId) params.append('clientId', filters.clientId.toString());
      if (filters?.productId) params.append('productId', filters.productId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.transactionType) params.append('transactionType', filters.transactionType);

      const response = await fetch(`/api/analytics/performance?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      const payload = (await response.json()) as PerformanceMetrics;
      return enrichPerformanceMetrics(payload);
    },
  });
}

/**
 * Hook to fetch client insights
 */
export function useClientInsights(filters?: AnalyticsFilters) {
  return useQuery<ClientInsights>({
    queryKey: ['/api/analytics/clients', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.clientId) params.append('clientId', filters.clientId.toString());
      if (filters?.productId) params.append('productId', filters.productId.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.transactionType) params.append('transactionType', filters.transactionType);

      const response = await fetch(`/api/analytics/clients?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client insights');
      }
      const payload = (await response.json()) as ClientInsights;
      return enrichClientInsights(payload);
    },
  });
}

