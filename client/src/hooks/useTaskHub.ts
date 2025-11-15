/**
 * Task Hub Hook
 * Phase 2: Timeline View & Prioritization UI
 * 
 * Hook for fetching and managing unified task/alert/appointment feed
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedItem {
  id: string; // Composite ID: "task-1", "alert-2", "appointment-3"
  type: 'task' | 'alert' | 'appointment';
  title: string;
  description?: string | null;
  urgency: 'now' | 'next' | 'scheduled';
  dueDate?: string | null;
  scheduledFor?: string | null;
  clientId?: number | null;
  prospectId?: number | null;
  priority?: string | null;
  severity?: string | null;
  completed?: boolean;
  read?: boolean;
  actionRequired?: boolean;
  createdAt: string;
  originalId: number;
  clientName?: string | null;
  prospectName?: string | null;
}

export interface UnifiedFeedFilters {
  timeframe?: 'now' | 'next' | 'scheduled' | 'all';
  clientId?: number;
  prospectId?: number;
  type?: 'task' | 'alert' | 'appointment' | 'all';
  status?: 'all' | 'pending' | 'completed' | 'dismissed';
}

/**
 * Hook for fetching unified task/alert/appointment feed
 */
export function useTaskHub(filters?: UnifiedFeedFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (filters?.timeframe) queryParams.append('timeframe', filters.timeframe);
  if (filters?.clientId) queryParams.append('clientId', filters.clientId.toString());
  if (filters?.prospectId) queryParams.append('prospectId', filters.prospectId.toString());
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.status) queryParams.append('status', filters.status);

  const queryString = queryParams.toString();
  const url = `/api/task-hub/feed${queryString ? `?${queryString}` : ''}`;

  // Fetch unified feed
  const { data, isLoading, error, refetch } = useQuery<UnifiedItem[]>({
    queryKey: ['/api/task-hub/feed', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error('Failed to fetch unified feed');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });

  // Complete task mutation with optimistic updates
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, { completed: true });
      if (!response.ok) {
        throw new Error('Failed to complete task');
      }
      return response.json();
    },
    onMutate: async (taskId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/task-hub/feed', filters] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<UnifiedItem[]>(['/api/task-hub/feed', filters]);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<UnifiedItem[]>(['/api/task-hub/feed', filters], (old) => {
          if (!old) return old;
          return old.map(item => {
            if (item.originalId === taskId && item.type === 'task') {
              return { ...item, completed: true };
            }
            return item;
          });
        });
      }

      return { previousData };
    },
    onError: (error: Error, taskId: number, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/task-hub/feed', filters], context.previousData);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete task',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task completed successfully',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  // Dismiss alert mutation with optimistic updates
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await apiRequest('PUT', `/api/portfolio-alerts/${alertId}`, { read: true });
      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }
      return response.json();
    },
    onMutate: async (alertId: number) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/task-hub/feed', filters] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<UnifiedItem[]>(['/api/task-hub/feed', filters]);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<UnifiedItem[]>(['/api/task-hub/feed', filters], (old) => {
          if (!old) return old;
          return old.map(item => {
            if (item.originalId === alertId && item.type === 'alert') {
              return { ...item, read: true };
            }
            return item;
          });
        });
      }

      return { previousData };
    },
    onError: (error: Error, alertId: number, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/task-hub/feed', filters], context.previousData);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to dismiss alert',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alert dismissed successfully',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-alerts'] });
    },
  });

  // Get items by urgency (memoized)
  const { nowItems, nextItems, scheduledItems } = React.useMemo(() => {
    if (!data) {
      return { nowItems: [], nextItems: [], scheduledItems: [] };
    }
    return {
      nowItems: data.filter(item => item.urgency === 'now'),
      nextItems: data.filter(item => item.urgency === 'next'),
      scheduledItems: data.filter(item => item.urgency === 'scheduled'),
    };
  }, [data]);

  return {
    items: data || [],
    nowItems,
    nextItems,
    scheduledItems,
    isLoading,
    error,
    refetch,
    completeTask: completeTaskMutation.mutate,
    dismissAlert: dismissAlertMutation.mutate,
    isCompletingTask: completeTaskMutation.isPending,
    isDismissingAlert: dismissAlertMutation.isPending,
  };
}

/**
 * Hook for fetching items by specific timeframe
 */
export function useTaskHubByTimeframe(
  timeframe: 'now' | 'next' | 'scheduled',
  filters?: Omit<UnifiedFeedFilters, 'timeframe'>
) {
  return useTaskHub({ ...filters, timeframe });
}

