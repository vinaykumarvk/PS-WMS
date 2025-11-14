/**
 * Module 7: Frontend-Backend Integration Enhancement
 * 7.2 Loading States
 * 
 * Enhanced hook for API calls with consistent loading states,
 * error handling, and data synchronization
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { APIError } from '@shared/utils/errors';
import { ErrorResponse, APIResponse } from '@shared/types/api.types';
import {
  handleError,
  getUserFriendlyErrorMessage,
  handleQueryError,
  handleMutationError,
} from '../lib/error-handler';
import { api } from '../lib/api-client';

export interface UseApiOptions<TData = any, TError = APIError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export interface UseApiQueryOptions<TData = any, TError = APIError> 
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn' | 'queryKey'>,
    UseApiOptions<TData, TError> {
  url: string;
  params?: Record<string, string | number | boolean | undefined>;
  enabled?: boolean;
}

export interface UseApiMutationOptions<TData = any, TVariables = any, TError = APIError>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>,
    UseApiOptions<TData, TError> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Hook for GET requests with loading and error states
 */
export function useApiQuery<TData = any>(
  options: UseApiQueryOptions<TData>
) {
  const {
    url,
    params,
    enabled = true,
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    ...queryOptions
  } = options;

  const query = useQuery<TData, APIError>({
    queryKey: [url, params],
    queryFn: async () => {
      return api.get<TData>(url, { params });
    },
    enabled,
    ...queryOptions,
  });

  // Handle success callback
  useEffect(() => {
    if (query.data && onSuccess) {
      onSuccess(query.data);
    }
  }, [query.data, onSuccess]);

  // Handle error callback
  useEffect(() => {
    if (query.error && onError) {
      onError(query.error);
    }
  }, [query.error, onError]);

  return {
    ...query,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    errorMessage: query.error ? getUserFriendlyErrorMessage(query.error) : undefined,
    refetch: query.refetch,
  };
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE) with loading and error states
 */
export function useApiMutation<TData = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const {
    url,
    method = 'POST',
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    ...mutationOptions
  } = options;

  const mutation = useMutation<TData, APIError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return api.post<TData>(url, variables);
        case 'PUT':
          return api.put<TData>(url, variables);
        case 'PATCH':
          return api.patch<TData>(url, variables);
        case 'DELETE':
          return api.delete<TData>(url);
        default:
          throw new APIError(`Unsupported method: ${method}`, 400);
      }
    },
    ...mutationOptions,
  });

  // Handle success callback
  useEffect(() => {
    if (mutation.data && onSuccess) {
      onSuccess(mutation.data);
    }
  }, [mutation.data, onSuccess]);

  // Handle error callback
  useEffect(() => {
    if (mutation.error && onError) {
      onError(mutation.error);
    }
  }, [mutation.error, onError]);

  return {
    ...mutation,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    errorMessage: mutation.error ? getUserFriendlyErrorMessage(mutation.error) : undefined,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    reset: mutation.reset,
  };
}

/**
 * Hook for manual API calls with loading state
 */
export function useApiCall<TData = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const execute = useCallback(async (
    requestFn: () => Promise<TData>,
    options?: UseApiOptions<TData>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      setData(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const apiError = handleError(err);
      setError(apiError);
      
      if (options?.onError) {
        options.onError(apiError as any);
      }
      
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    errorMessage: error ? getUserFriendlyErrorMessage(error) : undefined,
    reset: () => {
      setError(null);
      setData(null);
    },
  };
}

/**
 * Hook for multiple parallel API calls
 */
export function useApiParallel<TData = any>(
  requests: Array<() => Promise<TData>>,
  options?: UseApiOptions<TData[]>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [data, setData] = useState<TData[] | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(requests.map(req => req()));
      setData(results);
      
      if (options?.onSuccess) {
        options.onSuccess(results);
      }
      
      return results;
    } catch (err) {
      const apiError = handleError(err);
      setError(apiError);
      
      if (options?.onError) {
        options.onError(apiError as any);
      }
      
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [requests, options]);

  return {
    execute,
    isLoading,
    error,
    data,
    errorMessage: error ? getUserFriendlyErrorMessage(error) : undefined,
  };
}

/**
 * Hook for paginated API calls
 */
export function useApiPaginated<TData = any>(
  options: UseApiQueryOptions<TData[]> & {
    page?: number;
    pageSize?: number;
  }
) {
  const { page = 1, pageSize = 10, params, ...queryOptions } = options;
  
  const paginationParams = {
    ...params,
    page,
    pageSize,
  };

  return useApiQuery<TData[]>({
    ...queryOptions,
    params: paginationParams,
  });
}

