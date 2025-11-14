/**
 * use-automation Hook
 * Custom hook for automation features (Module 11)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type {
  AutoInvestRule,
  CreateAutoInvestRuleInput,
  UpdateAutoInvestRuleInput,
  RebalancingRule,
  CreateRebalancingRuleInput,
  RebalancingExecution,
  TriggerOrder,
  CreateTriggerOrderInput,
  NotificationPreference,
  CreateNotificationPreferenceInput,
  NotificationLog,
  AutomationExecutionLog,
} from '@shared/types/automation.types';

// ============================================================================
// Auto-Invest Rules
// ============================================================================

export function useAutoInvestRules(clientId?: number) {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<AutoInvestRule[]>({
    queryKey: ['/api/automation/auto-invest', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/automation/auto-invest?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const createRule = useMutation({
    mutationFn: async (input: CreateAutoInvestRuleInput) => {
      const response = await apiRequest('POST', '/api/automation/auto-invest', input);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create auto-invest rule');
      }
      return data.data as AutoInvestRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/auto-invest'] });
      toast({
        title: 'Auto-invest rule created',
        description: 'Auto-invest rule has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create auto-invest rule',
        variant: 'destructive',
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: UpdateAutoInvestRuleInput }) => {
      const response = await apiRequest('PUT', `/api/automation/auto-invest/${ruleId}`, updates);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update auto-invest rule');
      }
      return data.data as AutoInvestRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/auto-invest'] });
      toast({
        title: 'Auto-invest rule updated',
        description: 'Auto-invest rule has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update auto-invest rule',
        variant: 'destructive',
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest('DELETE', `/api/automation/auto-invest/${ruleId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete auto-invest rule');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/auto-invest'] });
      toast({
        title: 'Auto-invest rule deleted',
        description: 'Auto-invest rule has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete auto-invest rule',
        variant: 'destructive',
      });
    },
  });

  return {
    rules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
  };
}

export function useAutoInvestRule(ruleId: string | null) {
  return useQuery<AutoInvestRule | null>({
    queryKey: ['/api/automation/auto-invest', ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiRequest('GET', `/api/automation/auto-invest/${ruleId}`);
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!ruleId,
  });
}

// ============================================================================
// Rebalancing Rules
// ============================================================================

export function useRebalancingRules(clientId?: number) {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<RebalancingRule[]>({
    queryKey: ['/api/automation/rebalancing', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/automation/rebalancing?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const createRule = useMutation({
    mutationFn: async (input: CreateRebalancingRuleInput) => {
      const response = await apiRequest('POST', '/api/automation/rebalancing', input);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create rebalancing rule');
      }
      return data.data as RebalancingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rebalancing'] });
      toast({
        title: 'Rebalancing rule created',
        description: 'Rebalancing rule has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create rebalancing rule',
        variant: 'destructive',
      });
    },
  });

  const executeRebalancing = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await apiRequest('POST', `/api/automation/rebalancing/${ruleId}/execute`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to execute rebalancing');
      }
      return data.data as RebalancingExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rebalancing'] });
      toast({
        title: 'Rebalancing executed',
        description: 'Portfolio rebalancing has been executed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute rebalancing',
        variant: 'destructive',
      });
    },
  });

  return {
    rules,
    isLoading,
    createRule,
    executeRebalancing,
  };
}

export function useRebalancingRule(ruleId: string | null) {
  return useQuery<RebalancingRule | null>({
    queryKey: ['/api/automation/rebalancing', ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const response = await apiRequest('GET', `/api/automation/rebalancing/${ruleId}`);
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!ruleId,
  });
}

// ============================================================================
// Trigger Orders
// ============================================================================

export function useTriggerOrders(clientId?: number) {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<TriggerOrder[]>({
    queryKey: ['/api/automation/trigger-orders', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/automation/trigger-orders?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const createOrder = useMutation({
    mutationFn: async (input: CreateTriggerOrderInput) => {
      const response = await apiRequest('POST', '/api/automation/trigger-orders', input);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create trigger order');
      }
      return data.data as TriggerOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/trigger-orders'] });
      toast({
        title: 'Trigger order created',
        description: 'Trigger order has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create trigger order',
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoading,
    createOrder,
  };
}

export function useTriggerOrder(orderId: string | null) {
  return useQuery<TriggerOrder | null>({
    queryKey: ['/api/automation/trigger-orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await apiRequest('GET', `/api/automation/trigger-orders/${orderId}`);
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!orderId,
  });
}

// ============================================================================
// Notification Preferences
// ============================================================================

export function useNotificationPreferences(clientId?: number, userId?: number) {
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ['/api/automation/notification-preferences', clientId, userId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      if (userId) {
        params.append('userId', userId.toString());
      }
      const response = await apiRequest('GET', `/api/automation/notification-preferences?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const createPreference = useMutation({
    mutationFn: async (input: CreateNotificationPreferenceInput) => {
      const response = await apiRequest('POST', '/api/automation/notification-preferences', input);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create notification preference');
      }
      return data.data as NotificationPreference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/notification-preferences'] });
      toast({
        title: 'Notification preference created',
        description: 'Notification preference has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notification preference',
        variant: 'destructive',
      });
    },
  });

  const updatePreference = useMutation({
    mutationFn: async ({ prefId, updates }: { prefId: string; updates: Partial<CreateNotificationPreferenceInput> }) => {
      const response = await apiRequest('PUT', `/api/automation/notification-preferences/${prefId}`, updates);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update notification preference');
      }
      return data.data as NotificationPreference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/notification-preferences'] });
      toast({
        title: 'Notification preference updated',
        description: 'Notification preference has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification preference',
        variant: 'destructive',
      });
    },
  });

  const deletePreference = useMutation({
    mutationFn: async (prefId: string) => {
      const response = await apiRequest('DELETE', `/api/automation/notification-preferences/${prefId}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete notification preference');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/notification-preferences'] });
      toast({
        title: 'Notification preference deleted',
        description: 'Notification preference has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification preference',
        variant: 'destructive',
      });
    },
  });

  return {
    preferences,
    isLoading,
    createPreference,
    updatePreference,
    deletePreference,
  };
}

// ============================================================================
// Execution Logs
// ============================================================================

export function useAutomationExecutionLogs(
  clientId?: number,
  automationType?: string,
  automationId?: string
) {
  return useQuery<AutomationExecutionLog[]>({
    queryKey: ['/api/automation/execution-logs', clientId, automationType, automationId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      if (automationType) {
        params.append('automationType', automationType);
      }
      if (automationId) {
        params.append('automationId', automationId);
      }
      const response = await apiRequest('GET', `/api/automation/execution-logs?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });
}

export function useNotificationLogs(
  clientId?: number,
  event?: string,
  channel?: string
) {
  return useQuery<NotificationLog[]>({
    queryKey: ['/api/automation/notification-logs', clientId, event, channel],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      if (event) {
        params.append('event', event);
      }
      if (channel) {
        params.append('channel', channel);
      }
      const response = await apiRequest('GET', `/api/automation/notification-logs?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });
}

