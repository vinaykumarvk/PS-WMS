/**
 * Client Layout Component
 * 
 * Shared layout for all client detail routes
 * Provides navigation tabs and shared context
 */

import { Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ClientPageLayout } from "@/components/layout/ClientPageLayout";
import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

/**
 * Client Layout - Wraps all client detail routes
 * Provides shared layout with client info and navigation tabs
 */
export function ClientLayout() {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const numericClientId = clientId ? Number(clientId) : null;

  // Fetch client data
  const { data: client, isLoading, error } = useQuery({
    queryKey: [`/api/clients/${numericClientId}`],
    queryFn: () => numericClientId ? clientApi.getClient(numericClientId) : null,
    enabled: !!numericClientId,
  });

  // Update hash URL for compatibility
  useEffect(() => {
    if (clientId && location.pathname) {
      const hash = `#${location.pathname}${location.search}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId, location.pathname, location.search]);

  // Determine current tab from pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/personal')) return 'personal';
    if (path.includes('/portfolio')) return 'portfolio';
    if (path.includes('/actions')) return 'actions';
    if (path.includes('/interactions')) return 'interactions';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/communications')) return 'communications';
    if (path.includes('/appointments')) return 'appointments';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/insights')) return 'insights';
    if (path.includes('/goals')) return 'goals';
    return 'personal'; // default
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Client not found</h1>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <ClientPageLayout
      client={client}
      isLoading={isLoading}
      clientId={numericClientId!}
      currentTab={getCurrentTab()}
    >
      <Outlet />
    </ClientPageLayout>
  );
}

