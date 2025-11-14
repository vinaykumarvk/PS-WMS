/**
 * use-goals Hook
 * Custom hook for goal management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Goal,
  GoalProgress,
  GoalRecommendation,
  GoalType,
} from '../../../../../shared/types/order-management.types';

export interface CreateGoalInput {
  clientId: number;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetDate: string;
  monthlyContribution?: number;
  schemes?: { schemeId: number; allocation: number }[];
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
}

export interface UpdateGoalInput {
  name?: string;
  type?: GoalType;
  targetAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
  schemes?: { schemeId: number; allocation: number }[];
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
}

export function useGoals(clientId?: number) {
  const queryClient = useQueryClient();

  // Get all goals for a client
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ['/api/goals', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/goals?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });


  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const response = await apiRequest('POST', '/api/goals', input);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create goal');
      }
      return data.data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal created',
        description: `Goal "${data.name}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create goal',
        variant: 'destructive',
      });
    },
  });

  // Update goal mutation
  const updateGoal = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: UpdateGoalInput }) => {
      const response = await apiRequest('PUT', `/api/goals/${goalId}`, updates);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update goal');
      }
      return data.data as Goal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals', data.id] });
      toast({
        title: 'Goal updated',
        description: `Goal "${data.name}" has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update goal',
        variant: 'destructive',
      });
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await apiRequest('DELETE', `/api/goals/${goalId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete goal');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Goal deleted',
        description: 'Goal has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete goal',
        variant: 'destructive',
      });
    },
  });

  // Allocate order to goal mutation
  const allocateToGoal = useMutation({
    mutationFn: async ({
      goalId,
      transactionId,
      amount,
      notes,
    }: {
      goalId: string;
      transactionId: number;
      amount: number;
      notes?: string;
    }) => {
      const response = await apiRequest('POST', `/api/goals/${goalId}/allocate`, {
        transactionId,
        amount,
        notes,
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to allocate to goal');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: 'Allocated',
        description: 'Order has been allocated to goal successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to allocate to goal',
        variant: 'destructive',
      });
    },
  });

  return {
    goals,
    isLoadingGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    allocateToGoal,
  };
}

/**
 * Hook to get a single goal by ID
 * This is a standalone hook that doesn't require clientId
 */
export function useGoal(goalId: string | null) {
  return useQuery<Goal | null>({
    queryKey: ['/api/goals', goalId],
    queryFn: async () => {
      if (!goalId) return null;
      const response = await apiRequest('GET', `/api/goals/${goalId}`);
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!goalId,
  });
}

/**
 * Hook to get goal progress
 */
export function useGoalProgress(goalId: string | null) {
  return useQuery<GoalProgress | null>({
    queryKey: ['/api/goals', goalId, 'progress'],
    queryFn: async () => {
      if (!goalId) return null;
      const response = await apiRequest('GET', `/api/goals/${goalId}/progress`);
      const data = await response.json();
      return data.data as GoalProgress;
    },
    enabled: !!goalId,
  });
}

/**
 * Hook to get goal recommendations
 */
export function useGoalRecommendations(clientId: number) {
  return useQuery<GoalRecommendation[]>({
    queryKey: ['/api/goals/recommendations', clientId],
    queryFn: async () => {
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/goals/recommendations?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });
}
