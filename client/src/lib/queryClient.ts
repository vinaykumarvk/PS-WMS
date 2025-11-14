import { QueryClient, QueryFunction, useQuery } from "@tanstack/react-query";
import React from "react";
import { apiCache, cacheKeys, cacheTTLs } from "./api-cache";
import { measureAPICall, performanceMonitor } from "./performance-monitor";

export function useApiQuery<T>(options: Parameters<typeof useQuery<T>>[0] & {
  queryParams?: Record<string, string>
}) {
  const { queryKey, queryParams, ...rest } = options;
  
  // Create URL with query parameters if provided
  const enhancedQueryKey = React.useMemo(() => {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return queryKey;
    }
    
    const baseUrl = queryKey[0] as string;
    const url = new URL(baseUrl, window.location.origin);
    
    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    // Replace first element of queryKey with the enhanced URL
    return [url.pathname + url.search, ...(queryKey as any).slice(1)];
  }, [queryKey, queryParams]);
  
  return useQuery<T>({
    ...rest,
    queryKey: enhancedQueryKey,
  });
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Only cache GET requests
  if (method === 'GET') {
    const cached = apiCache.get<Response>(url);
    if (cached) {
      performanceMonitor.record(`api:cache-hit:${url}`, 0, { url, method });
      // Return cached response as a new Response object
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return measureAPICall(url, async () => {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Cache GET responses
    if (method === 'GET' && res.ok) {
      try {
        const responseData = await res.clone().json();
        // Determine cache TTL based on endpoint
        let ttl = cacheTTLs.products; // default
        if (url.includes('/products')) ttl = cacheTTLs.products;
        else if (url.includes('/portfolio')) ttl = cacheTTLs.portfolio;
        else if (url.includes('/holdings')) ttl = cacheTTLs.holdings;
        else if (url.includes('/favorites')) ttl = cacheTTLs.favorites;
        else if (url.includes('/recent-orders')) ttl = cacheTTLs.recentOrders;
        else if (url.includes('/sip')) ttl = cacheTTLs.sipPlans;
        
        apiCache.set(url, responseData, ttl);
      } catch (e) {
        // If response is not JSON, don't cache
        console.warn('Failed to cache non-JSON response:', url);
      }
    }
    
    return res;
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Check cache first
    const cached = apiCache.get<T>(url);
    if (cached) {
      performanceMonitor.record(`query:cache-hit:${url}`, 0, { url });
      return cached;
    }

    return measureAPICall(url, async () => {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache the response
      let ttl = cacheTTLs.products; // default
      if (url.includes('/products')) ttl = cacheTTLs.products;
      else if (url.includes('/portfolio')) ttl = cacheTTLs.portfolio;
      else if (url.includes('/holdings')) ttl = cacheTTLs.holdings;
      else if (url.includes('/favorites')) ttl = cacheTTLs.favorites;
      else if (url.includes('/recent-orders')) ttl = cacheTTLs.recentOrders;
      else if (url.includes('/sip')) ttl = cacheTTLs.sipPlans;
      
      apiCache.set(url, data, ttl);
      
      return data;
    });
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
