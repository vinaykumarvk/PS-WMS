/**
 * Route Loaders
 * 
 * Data loaders for React Router routes
 * These can be used to preload data before rendering components
 */

import { queryClient } from "@/lib/queryClient";
import { clientApi } from "@/lib/api";

/**
 * Client loader - preloads client data
 * Note: Currently using React Query in components, but this can be used for SSR/preloading
 */
export async function clientLoader({ params }: { params: { clientId: string } }) {
  const clientId = Number(params.clientId);
  
  if (!clientId || isNaN(clientId)) {
    throw new Response("Client ID is required", { status: 400 });
  }

  // Prefetch client data using React Query
  await queryClient.prefetchQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: () => clientApi.getClient(clientId),
  });

  return { clientId };
}

/**
 * Prospect loader - preloads prospect data
 */
export async function prospectLoader({ params }: { params: { prospectId: string } }) {
  const prospectId = Number(params.prospectId);
  
  if (!prospectId || isNaN(prospectId)) {
    throw new Response("Prospect ID is required", { status: 400 });
  }

  // Prefetch prospect data
  await queryClient.prefetchQuery({
    queryKey: ['/api/prospects', prospectId],
    queryFn: async () => {
      const response = await fetch(`/api/prospects/${prospectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prospect details");
      }
      return response.json();
    },
  });

  return { prospectId };
}

