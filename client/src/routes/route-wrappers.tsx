/**
 * Route Wrapper Components
 * 
 * Wrappers that extract route parameters and pass them to page components
 * This allows gradual migration without changing page component signatures
 */

import { useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import ClientPersonal from "@/pages/client-personal";
import ClientPortfolio from "@/pages/client-portfolio";
import ClientActions from "@/pages/client-actions";
import ClientInteractions from "@/pages/client-interactions";
import ClientTransactions from "@/pages/client-transactions";
import ClientCommunications from "@/pages/client-communications";
import ClientAppointments from "@/pages/client-appointments";
import ClientTasks from "@/pages/client-tasks";
import ClientInsights from "@/pages/client-insights";
import ClientGoals from "@/pages/client-goals";
import AddProspect from "@/pages/add-prospect";

/**
 * Wrapper for ClientPersonal that extracts clientId from route params
 */
export function ClientPersonalWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  
  // Update URL hash to maintain compatibility with existing code that reads from hash
  useEffect(() => {
    if (clientId) {
      const section = searchParams.get('section');
      const hash = section ? `#/clients/${clientId}/personal${section ? `?section=${section}` : ''}` : `#/clients/${clientId}/personal`;
      // Only update if different to avoid loops
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId, searchParams]);

  return <ClientPersonal />;
}

/**
 * Wrapper for ClientPortfolio
 */
export function ClientPortfolioWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/portfolio`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientPortfolio />;
}

/**
 * Wrapper for ClientActions
 */
export function ClientActionsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/actions`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientActions />;
}

/**
 * Wrapper for ClientInteractions
 */
export function ClientInteractionsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/interactions`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientInteractions />;
}

/**
 * Wrapper for ClientTransactions
 */
export function ClientTransactionsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/transactions`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientTransactions />;
}

/**
 * Wrapper for ClientCommunications
 */
export function ClientCommunicationsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/communications`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientCommunications />;
}

/**
 * Wrapper for ClientAppointments
 */
export function ClientAppointmentsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/appointments`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientAppointments />;
}

/**
 * Wrapper for ClientTasks
 */
export function ClientTasksWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/tasks`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientTasks />;
}

/**
 * Wrapper for ClientInsights
 */
export function ClientInsightsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/insights`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientInsights />;
}

/**
 * Wrapper for ClientGoals
 */
export function ClientGoalsWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  
  useEffect(() => {
    if (clientId) {
      const hash = `#/clients/${clientId}/goals`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [clientId]);

  return <ClientGoals />;
}

/**
 * Wrapper for AddProspect (view mode)
 */
export function ProspectDetailWrapper() {
  const { prospectId } = useParams<{ prospectId: string }>();
  
  useEffect(() => {
    if (prospectId) {
      const hash = `#/prospect-detail/${prospectId}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [prospectId]);

  return <AddProspect prospectId={prospectId ? Number(prospectId) : undefined} readOnly={true} />;
}

/**
 * Wrapper for AddProspect (edit mode)
 */
export function ProspectEditWrapper() {
  const { prospectId } = useParams<{ prospectId: string }>();
  
  useEffect(() => {
    if (prospectId) {
      const hash = `#/prospect-edit/${prospectId}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [prospectId]);

  return <AddProspect prospectId={prospectId ? Number(prospectId) : undefined} readOnly={false} />;
}

