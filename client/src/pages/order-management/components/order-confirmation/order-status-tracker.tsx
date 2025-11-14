/**
 * Module 1.4: Order Status Tracker Component
 * Tracks order status changes in real-time
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { OrderStatus } from '../../../types/order.types';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

interface OrderStatusTrackerProps {
  orderId: number;
  currentStatus: OrderStatus;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export default function OrderStatusTracker({ 
  orderId, 
  currentStatus,
  onStatusChange 
}: OrderStatusTrackerProps) {
  const [previousStatus, setPreviousStatus] = useState<OrderStatus>(currentStatus);

  const { data: order } = useQuery({
    queryKey: ['/api/order-management/orders', orderId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/order-management/orders/${orderId}`);
      const data = await response.json();
      return data.data || data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: !!orderId,
  });

  useEffect(() => {
    if (order && order.status !== previousStatus) {
      setPreviousStatus(order.status);
      onStatusChange?.(order.status);
    }
  }, [order, previousStatus, onStatusChange]);

  const getStatusIcon = (status: OrderStatus) => {
    if (status.includes('Failed') || status.includes('Rejected') || status.includes('Cancelled')) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (status.includes('Settled') || status.includes('Executed')) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (status.includes('Pending')) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
  };

  const status = order?.status || currentStatus;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="font-medium">Current Status</span>
          </div>
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

