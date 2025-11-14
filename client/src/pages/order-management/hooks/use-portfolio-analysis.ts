/**
 * Portfolio Analysis Hook
 * Module B: Portfolio-Aware Ordering
 * Handles API calls for portfolio analysis features
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type {
  PortfolioData,
  PortfolioImpact,
  AllocationGap,
  RebalancingSuggestion,
  Holding,
  TargetAllocation,
} from '@shared/types/portfolio.types';
import type { CartItem } from '../types/order.types';
import type { APIResponse } from '@shared/types/api.types';

/**
 * Get current portfolio data
 */
export function usePortfolio(clientId: number | null, includeHoldings: boolean = true) {
  return useQuery<PortfolioData>({
    queryKey: ['/api/portfolio/current-allocation', clientId, includeHoldings],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      const response = await apiRequest(
        'GET',
        `/api/portfolio/current-allocation?clientId=${clientId}&includeHoldings=${includeHoldings}`
      );
      const data: APIResponse<PortfolioData> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch portfolio');
      }
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get portfolio impact preview for an order
 */
export function useImpactPreview(clientId: number | null, order: CartItem[]) {
  return useQuery<PortfolioImpact>({
    queryKey: ['/api/portfolio/impact-preview', clientId, order],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      if (!order || order.length === 0) throw new Error('Order items are required');
      
      const response = await apiRequest('POST', '/api/portfolio/impact-preview', {
        clientId,
        order,
      });
      const data: APIResponse<PortfolioImpact> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to calculate impact preview');
      }
      
      return data.data;
    },
    enabled: !!clientId && !!order && order.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get allocation gaps
 */
export function useAllocationGaps(clientId: number | null, targetAllocation?: TargetAllocation) {
  return useQuery<AllocationGap[]>({
    queryKey: ['/api/portfolio/allocation-gaps', clientId, targetAllocation],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      const params = new URLSearchParams({
        clientId: clientId.toString(),
      });
      
      if (targetAllocation) {
        params.append('targetAllocation', JSON.stringify(targetAllocation));
      }
      
      const response = await apiRequest(
        'GET',
        `/api/portfolio/allocation-gaps?${params.toString()}`
      );
      const data: APIResponse<AllocationGap[]> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to calculate allocation gaps');
      }
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get rebalancing suggestions
 */
export function useRebalancingSuggestions(clientId: number | null, targetAllocation?: TargetAllocation) {
  return useQuery<RebalancingSuggestion[]>({
    queryKey: ['/api/portfolio/rebalancing-suggestions', clientId, targetAllocation],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      const params = new URLSearchParams({
        clientId: clientId.toString(),
      });
      
      if (targetAllocation) {
        params.append('targetAllocation', JSON.stringify(targetAllocation));
      }
      
      const response = await apiRequest(
        'GET',
        `/api/portfolio/rebalancing-suggestions?${params.toString()}`
      );
      const data: APIResponse<RebalancingSuggestion[]> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to generate rebalancing suggestions');
      }
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get client holdings
 */
export function useHoldings(clientId: number | null, schemeId?: number) {
  return useQuery<Holding[]>({
    queryKey: ['/api/portfolio/holdings', clientId, schemeId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      
      const params = new URLSearchParams({
        clientId: clientId.toString(),
      });
      
      if (schemeId) {
        params.append('schemeId', schemeId.toString());
      }
      
      const response = await apiRequest(
        'GET',
        `/api/portfolio/holdings?${params.toString()}`
      );
      const data: APIResponse<Holding[]> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch holdings');
      }
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Mutation to refresh portfolio data
 */
export function useRefreshPortfolio() {
  return useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest(
        'GET',
        `/api/portfolio/current-allocation?clientId=${clientId}&includeHoldings=true`
      );
      const data: APIResponse<PortfolioData> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to refresh portfolio');
      }
      
      return data.data;
    },
  });
}

