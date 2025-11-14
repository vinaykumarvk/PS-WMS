/**
 * Recent Orders Component
 * Module A: Quick Order Placement
 * Displays recent orders for quick reorder
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Loader2 } from 'lucide-react';
import { RecentOrder } from '../../types/quick-order.types';
import { EmptyState } from '@/components/empty-state';
import { formatDistanceToNow } from 'date-fns';

interface RecentOrdersProps {
  recentOrders: RecentOrder[];
  isLoading?: boolean;
  onReorder: (order: RecentOrder) => void;
  isReordering?: boolean;
}

export default function RecentOrders({
  recentOrders,
  isLoading = false,
  onReorder,
  isReordering = false,
}: RecentOrdersProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recentOrders.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12 text-muted-foreground" />}
        title="No recent orders"
        description="Your recent orders will appear here for quick reorder."
      />
    );
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status.includes('Settled') || status.includes('Executed')) return 'default';
    if (status.includes('Failed') || status.includes('Rejected')) return 'destructive';
    if (status.includes('Pending')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-3">
      {recentOrders.map((order) => (
        <Card key={order.id} className="border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground truncate">{order.schemeName}</h4>
                  <Badge variant={getStatusColor(order.status)} className="text-xs">
                    {order.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-foreground">
                      ₹{order.amount.toLocaleString()}
                    </span>
                    <span className="capitalize">{order.transactionType.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-mono text-xs">{order.modelOrderId}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReorder(order)}
                  disabled={isReordering}
                  className="whitespace-nowrap"
                >
                  {isReordering ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Reorder'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

