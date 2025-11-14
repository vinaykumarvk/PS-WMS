/**
 * Module 1.4: Order Timeline Component
 * Displays order status progression timeline
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  description: string;
  userId?: number;
  reason?: string;
}

interface OrderTimelineProps {
  orderId: number;
}

export default function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { data: timeline, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['/api/order-management/orders', orderId, 'timeline'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/order-management/orders/${orderId}/timeline`);
      const data = await response.json();
      const timelineData = data.data || data || [];
      // Ensure we always return an array
      return Array.isArray(timelineData) ? timelineData : [];
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No timeline events available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status.includes('Failed') || status.includes('Rejected') || status.includes('Cancelled')) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (status.includes('Settled') || status.includes('Executed')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (status.includes('Pending')) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {timeline.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Icon */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-border">
                  {getStatusIcon(event.status)}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{event.status}</p>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                  {event.reason && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      Reason: {event.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

