/**
 * Redemption Hook
 * Module E: Instant Redemption Features
 * Handles API calls for redemption features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import type {
  RedemptionCalculation,
  InstantRedemptionEligibility,
  RedemptionHistory,
} from '@shared/types/order-management.types';
import { CartItem } from '../types/order.types';

/**
 * Calculate redemption amount
 */
export function useCalculateRedemption() {
  return useMutation({
    mutationFn: async (params: {
      schemeId: number;
      units?: number;
      amount?: number;
      redemptionType?: 'Standard' | 'Instant' | 'Full';
    }): Promise<RedemptionCalculation> => {
      const response = await apiRequest('POST', '/api/redemption/calculate', params);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to calculate redemption');
      }
      return data.data;
    },
    onError: (error: any) => {
      toast({
        title: 'Calculation failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Check instant redemption eligibility
 */
export function useCheckInstantRedemptionEligibility() {
  return useMutation({
    mutationFn: async (params: {
      schemeId: number;
      amount: number;
    }): Promise<InstantRedemptionEligibility> => {
      const response = await apiRequest('GET', `/api/redemption/eligibility?schemeId=${params.schemeId}&amount=${params.amount}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to check eligibility');
      }
      return data.data;
    },
  });
}

/**
 * Execute instant redemption
 */
export function useExecuteInstantRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      schemeId: number;
      amount: number;
    }): Promise<{ cartItem: CartItem; orderId?: number }> => {
      const response = await apiRequest('POST', '/api/redemption/instant', params);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to execute instant redemption');
      }
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/redemption/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/orders'] });
      toast({
        title: 'Redemption added to cart',
        description: 'Instant redemption has been added to your cart.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Redemption failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Execute standard redemption
 */
export function useExecuteRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      schemeId: number;
      units?: number;
      amount?: number;
      redemptionType: 'Standard' | 'Instant' | 'Full';
      isFullRedemption?: boolean;
    }): Promise<{ cartItem: CartItem; orderId?: number }> => {
      const response = await apiRequest('POST', '/api/redemption/execute', params);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to execute redemption');
      }
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/redemption/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/orders'] });
      toast({
        title: 'Redemption added to cart',
        description: 'Redemption has been added to your cart.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Redemption failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get redemption history
 */
export function useRedemptionHistory(filters?: {
  schemeId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.schemeId) queryParams.append('schemeId', filters.schemeId.toString());
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.status) queryParams.append('status', filters.status);

  return useQuery<RedemptionHistory[]>({
    queryKey: ['/api/redemption/history', filters],
    queryFn: async () => {
      const url = `/api/redemption/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest('GET', url);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch redemption history');
      }
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

