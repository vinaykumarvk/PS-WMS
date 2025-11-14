/**
 * Module 1.1: Order Confirmation Hook
 * Custom hook for order confirmation functionality
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Order } from '../types/order.types';

export function useOrderConfirmation(orderId: number | null) {
  return useQuery<Order>({
    queryKey: ['/api/order-management/orders', orderId, 'confirmation'],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await apiRequest('GET', `/api/order-management/orders/${orderId}/confirmation`);
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!orderId,
  });
}

