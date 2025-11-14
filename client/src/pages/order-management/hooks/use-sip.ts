/**
 * use-sip Hook
 * Custom hook for SIP operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  SIPPlan,
  SIPBuilderInput,
  SIPCalculatorInput,
  SIPCalculatorResult,
  SIPCalendarEvent,
  SIPPerformance,
  SIPFrequency,
} from '../../../../../shared/types/sip.types';

export function useSIP(clientId?: number) {
  const queryClient = useQueryClient();

  // Get SIP plans for a client
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SIPPlan[]>({
    queryKey: ['/api/sip', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      const response = await apiRequest('GET', `/api/sip?${params.toString()}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!clientId,
  });

  // Get SIP plan by ID
  const useSIPPlan = (planId: string) => {
    return useQuery<SIPPlan | null>({
      queryKey: ['/api/sip', planId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/sip/${planId}`);
        const data = await response.json();
        return data.data || null;
      },
      enabled: !!planId,
    });
  };

  // Create SIP mutation
  const createSIP = useMutation({
    mutationFn: async (data: SIPBuilderInput & { clientId: number }) => {
      const response = await apiRequest('POST', '/api/sip/create', data);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create SIP');
      }
      return result.data as SIPPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip'] });
      toast({
        title: 'SIP Created',
        description: 'Your SIP plan has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create SIP',
        variant: 'destructive',
      });
    },
  });

  // Pause SIP mutation
  const pauseSIP = useMutation({
    mutationFn: async ({ planId, pauseUntil }: { planId: string; pauseUntil?: string }) => {
      const response = await apiRequest('PUT', `/api/sip/${planId}/pause`, { pauseUntil });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to pause SIP');
      }
      return result.data as SIPPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip'] });
    },
  });

  // Resume SIP mutation
  const resumeSIP = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('PUT', `/api/sip/${planId}/resume`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to resume SIP');
      }
      return result.data as SIPPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip'] });
    },
  });

  // Modify SIP mutation
  const modifySIP = useMutation({
    mutationFn: async ({
      planId,
      updates,
    }: {
      planId: string;
      updates: { newAmount?: number; newFrequency?: SIPFrequency };
    }) => {
      const response = await apiRequest('PUT', `/api/sip/${planId}/modify`, updates);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to modify SIP');
      }
      return result.data as SIPPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip'] });
    },
  });

  // Cancel SIP mutation
  const cancelSIP = useMutation({
    mutationFn: async ({ planId, reason }: { planId: string; reason: string }) => {
      const response = await apiRequest('PUT', `/api/sip/${planId}/cancel`, { reason });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel SIP');
      }
      return result.data as SIPPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sip'] });
    },
  });

  // Calculate SIP
  const calculateSIP = useMutation({
    mutationFn: async (input: SIPCalculatorInput) => {
      const response = await apiRequest('POST', '/api/sip/calculator', input);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to calculate SIP');
      }
      return result.data as SIPCalculatorResult;
    },
  });

  // Get SIP calendar events
  const useSIPCalendar = (clientId: number, startDate: string, endDate: string) => {
    return useQuery<SIPCalendarEvent[]>({
      queryKey: ['/api/sip/calendar', clientId, startDate, endDate],
      queryFn: async () => {
        const params = new URLSearchParams({
          clientId: clientId.toString(),
          startDate,
          endDate,
        });
        const response = await apiRequest('GET', `/api/sip/calendar?${params.toString()}`);
        const data = await response.json();
        return data.data || [];
      },
      enabled: !!clientId && !!startDate && !!endDate,
    });
  };

  // Get SIP performance
  const useSIPPerformance = (planId: string) => {
    return useQuery<SIPPerformance>({
      queryKey: ['/api/sip/performance', planId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/sip/${planId}/performance`);
        const data = await response.json();
        return data.data;
      },
      enabled: !!planId,
    });
  };

  return {
    plans,
    isLoadingPlans,
    useSIPPlan,
    createSIP: createSIP.mutateAsync,
    pauseSIP: pauseSIP.mutateAsync,
    resumeSIP: resumeSIP.mutateAsync,
    modifySIP: modifySIP.mutateAsync,
    cancelSIP: cancelSIP.mutateAsync,
    calculateSIP: calculateSIP.mutateAsync,
    useSIPCalendar,
    useSIPPerformance,
    isCreating: createSIP.isPending,
    isPausing: pauseSIP.isPending,
    isResuming: resumeSIP.isPending,
    isModifying: modifySIP.isPending,
    isCancelling: cancelSIP.isPending,
    isCalculating: calculateSIP.isPending,
  };
}

