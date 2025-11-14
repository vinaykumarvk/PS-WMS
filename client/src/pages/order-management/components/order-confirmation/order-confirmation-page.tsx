/**
 * Module 1.1: Order Confirmation Page
 * Displays order confirmation details after successful submission
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Download, Mail, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { Order } from '../../../types/order.types';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import OrderSummary from './order-summary';
import OrderTimeline from './order-timeline';
import ReceiptActions from './receipt-actions';

interface OrderConfirmationPageProps {
  orderId: number;
  onBack?: () => void;
}

export default function OrderConfirmationPage({ orderId, onBack }: OrderConfirmationPageProps) {

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/order-management/orders', orderId, 'confirmation'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/order-management/orders/${orderId}/confirmation`);
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">Failed to load order confirmation</p>
              <Button onClick={() => onBack?.() || (window.location.hash = '#/order-management')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Confirmation</h1>
          <p className="text-muted-foreground mt-1">
            Your order has been submitted successfully
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onBack?.() || (window.location.hash = '#/order-management')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      {/* Success Banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Order Submitted Successfully
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your order <strong>{order.modelOrderId}</strong> has been received and is pending approval.
                You will receive an email confirmation shortly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <OrderSummary order={order} />

          {/* Order Timeline */}
          <OrderTimeline orderId={orderId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order ID</span>
                  <span className="text-sm font-mono">{order.modelOrderId}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{format(new Date(order.submittedAt), 'PPp')}</span>
                </div>
                {order.authorizedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Authorized</span>
                    <span>{format(new Date(order.authorizedAt), 'PPp')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt Actions */}
          <ReceiptActions orderId={orderId} order={order} />
        </div>
      </div>
    </div>
  );
}

