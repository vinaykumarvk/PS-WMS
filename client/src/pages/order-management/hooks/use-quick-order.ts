/**
 * Quick Order Hook
 * Module A: Quick Order Placement
 * Handles API calls for quick order features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Favorite, RecentOrder, QuickOrderRequest, QuickOrderResponse } from '../types/quick-order.types';
import { CartItem } from '../types/order.types';

/**
 * Get favorite schemes
 */
export function useFavorites() {
  return useQuery<Favorite[]>({
    queryKey: ['/api/quick-order/favorites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/quick-order/favorites');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Add scheme to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', '/api/quick-order/favorites', { productId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-order/favorites'] });
      toast({
        title: 'Added to favorites',
        description: 'Scheme has been added to your favorites.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add favorite',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Remove scheme from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteId: string) => {
      const response = await apiRequest('DELETE', `/api/quick-order/favorites/${favoriteId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quick-order/favorites'] });
      toast({
        title: 'Removed from favorites',
        description: 'Scheme has been removed from your favorites.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove favorite',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get recent orders
 */
export function useRecentOrders(limit: number = 5) {
  return useQuery<RecentOrder[]>({
    queryKey: ['/api/quick-order/recent', { limit }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/quick-order/recent?limit=${limit}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Place quick order
 */
export function usePlaceQuickOrder() {
  return useMutation({
    mutationFn: async (orderData: QuickOrderRequest): Promise<QuickOrderResponse> => {
      const response = await apiRequest('POST', '/api/quick-order/place', orderData);
      return await response.json();
    },
    onSuccess: (data: QuickOrderResponse) => {
      if (data.success) {
        toast({
          title: 'Order added to cart',
          description: data.message || 'Order has been added to your cart.',
        });
      } else {
        toast({
          title: 'Failed to place order',
          description: data.errors?.join('. ') || data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to place order',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

