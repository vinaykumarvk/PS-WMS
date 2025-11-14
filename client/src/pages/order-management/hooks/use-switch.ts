/**
 * Switch Hook
 * Module D: Advanced Switch Features
 * Handles API calls for switch operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import {
  SwitchCalculation,
  PartialSwitch,
  MultiSchemeSwitch,
  SwitchRecommendation,
} from '../../../../shared/types/order-management.types';

/**
 * Calculate switch tax implications and costs
 */
export function useSwitchCalculation() {
  return useMutation({
    mutationFn: async (params: {
      sourceSchemeId: number;
      targetSchemeId: number;
      amount?: number;
      units?: number;
    }): Promise<SwitchCalculation> => {
      const response = await apiRequest('POST', '/api/switch/calculate', params);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to calculate switch');
      }
      return data.data;
    },
    onError: (error: any) => {
      toast({
        title: 'Calculation failed',
        description: error.message || 'Failed to calculate switch details.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Execute partial switch
 */
export function usePartialSwitch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PartialSwitch) => {
      const response = await apiRequest('POST', '/api/switch/partial', params);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/switch/history'] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
        toast({
          title: 'Switch executed',
          description: data.message || 'Partial switch has been executed successfully.',
        });
      } else {
        toast({
          title: 'Switch failed',
          description: data.message || 'Failed to execute partial switch.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Switch failed',
        description: error.message || 'Failed to execute partial switch.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Execute multi-scheme switch
 */
export function useMultiSchemeSwitch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MultiSchemeSwitch) => {
      const response = await apiRequest('POST', '/api/switch/multi-scheme', params);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/switch/history'] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
        toast({
          title: 'Switch executed',
          description: data.message || 'Multi-scheme switch has been executed successfully.',
        });
      } else {
        toast({
          title: 'Switch failed',
          description: data.message || 'Failed to execute multi-scheme switch.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Switch failed',
        description: error.message || 'Failed to execute multi-scheme switch.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get switch history
 */
export function useSwitchHistory(clientId?: number, filters?: any) {
  return useQuery({
    queryKey: ['/api/switch/history', { clientId, filters }],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams({ clientId: clientId.toString() });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiRequest('GET', `/api/switch/history?${params.toString()}`);
      const data = await response.json();
      return data.success ? (Array.isArray(data.data) ? data.data : []) : [];
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get switch recommendations
 */
export function useSwitchRecommendations(clientId?: number) {
  return useQuery<SwitchRecommendation[]>({
    queryKey: ['/api/switch/recommendations', { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await apiRequest('GET', `/api/switch/recommendations?clientId=${clientId}`);
      const data = await response.json();
      return data.success ? (Array.isArray(data.data) ? data.data : []) : [];
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

