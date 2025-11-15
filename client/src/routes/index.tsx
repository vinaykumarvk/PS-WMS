/**
 * React Router Configuration
 * 
 * This file contains route definitions for migrated routes.
 * Routes are migrated gradually, so both old and new routers coexist.
 */

import { createHashRouter, RouteObject, Navigate, Outlet, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AuthenticatedLayout, PublicLayout } from "./layouts";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  ClientPersonalWrapper,
  ClientPortfolioWrapper,
  ClientActionsWrapper,
  ClientInteractionsWrapper,
  ClientTransactionsWrapper,
  ClientCommunicationsWrapper,
  ClientAppointmentsWrapper,
  ClientTasksWrapper,
  ClientInsightsWrapper,
  ClientGoalsWrapper,
  ProspectDetailWrapper,
  ProspectEditWrapper,
} from "./route-wrappers";
import { clientLoader, prospectLoader } from "./loaders";

// Import pages (using same imports as App.tsx for consistency)
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import HelpCenter from "@/pages/help-center";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Clients from "@/pages/clients";
import Prospects from "@/pages/prospects";
import AddClientPage from "@/pages/add-client";
import AddProspect from "@/pages/add-prospect";

// Import remaining pages
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import ClientCommunications from "@/pages/client-communications";
import TalkingPoints from "@/pages/talking-points";
import Announcements from "@/pages/announcements";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import Analytics from "@/pages/analytics";
import Products from "@/pages/products";
import QMPortal from "@/pages/qm-portal";
import KnowledgeProfiling from "@/pages/knowledge-profiling";
import RiskProfiling from "@/pages/risk-profiling";
import AddFinancialProfilePage from "@/pages/add-financial-profile";

// Lazy loaded pages
const OrderManagement = lazy(() => import("@/pages/order-management"));
const OrderConfirmationPage = lazy(() => import("@/pages/order-management/components/order-confirmation/order-confirmation-page"));
const AutomationPage = lazy(() => import("@/pages/automation"));
const SIPBuilderManager = lazy(() => import("@/pages/sip-builder-manager"));

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Component that renders the old router for unmigrated routes
 * This allows gradual migration - unmigrated routes still use the old router
 */
function OldRouterFallback() {
  // This will be handled by the main App component
  // We'll import AuthenticatedApp here to avoid circular dependencies
  return null;
}

/**
 * Phase 1 Routes - Simple routes without dynamic parameters
 * 
 * Migrated routes:
 * - /login (public)
 * - / (dashboard) - authenticated
 * - /help, /help-center - authenticated
 * - /settings - authenticated
 * - /profile - authenticated
 */
const phase1Routes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <ProtectedRoute requireAuth={false}>
        <PublicLayout children={<LoginPage />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Dashboard />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/help",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<HelpCenter />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/help-center",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<HelpCenter />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Settings />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Profile />} />
      </ProtectedRoute>
    ),
  },
];

/**
 * Phase 2 Routes - Client list routes (no dynamic parameters)
 * 
 * Migrated routes:
 * - /clients - Clients list page
 * - /clients/add - Add new client page
 * - /prospects - Prospects list page
 * - /prospects/new - Add new prospect page
 */
const phase2Routes: RouteObject[] = [
  {
    path: "/clients",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Clients />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clients/add",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<AddClientPage />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/prospects",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Prospects />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/prospects/new",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<AddProspect />} />
      </ProtectedRoute>
    ),
  },
];

/**
 * Phase 3 Routes - Dynamic routes with parameters
 * Phase 4: Refactored to nested routes structure
 * 
 * Migrated routes (nested under /clients/:clientId):
 * - /clients/:clientId - Client detail (defaults to personal) - redirects to /personal
 * - /clients/:clientId/personal - Client personal info
 * - /clients/:clientId/portfolio - Client portfolio
 * - /clients/:clientId/actions - Client actions
 * - /clients/:clientId/interactions - Client interactions
 * - /clients/:clientId/transactions - Client transactions
 * - /clients/:clientId/communications - Client communications
 * - /clients/:clientId/appointments - Client appointments
 * - /clients/:clientId/tasks - Client tasks
 * - /clients/:clientId/insights - Client insights
 * - /clients/:clientId/goals - Client goals
 * 
 * Prospect routes:
 * - /prospect-detail/:prospectId - Prospect detail (read-only)
 * - /prospect-edit/:prospectId - Prospect edit
 */
const phase3Routes: RouteObject[] = [
  // Nested client routes - all share the same loader
  {
    path: "/clients/:clientId",
    loader: clientLoader,
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          {/* Outlet will render the matched child route */}
          <Outlet />
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="personal" replace />,
      },
      {
        path: "personal",
        element: <ClientPersonalWrapper />,
      },
      {
        path: "portfolio",
        element: <ClientPortfolioWrapper />,
      },
      {
        path: "actions",
        element: <ClientActionsWrapper />,
      },
      {
        path: "interactions",
        element: <ClientInteractionsWrapper />,
      },
      {
        path: "transactions",
        element: <ClientTransactionsWrapper />,
      },
      {
        path: "communications",
        element: <ClientCommunicationsWrapper />,
      },
      {
        path: "appointments",
        element: <ClientAppointmentsWrapper />,
      },
      {
        path: "tasks",
        element: <ClientTasksWrapper />,
      },
      {
        path: "insights",
        element: <ClientInsightsWrapper />,
      },
      {
        path: "goals",
        element: <ClientGoalsWrapper />,
      },
    ],
  },
  // Prospect routes (not nested, but could be in future)
  {
    path: "/prospect-detail/:prospectId",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<ProspectDetailWrapper />} />
      </ProtectedRoute>
    ),
    loader: prospectLoader,
  },
  {
    path: "/prospect-edit/:prospectId",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<ProspectEditWrapper />} />
      </ProtectedRoute>
    ),
    loader: prospectLoader,
  },
];

/**
 * Wrapper for OrderConfirmationPage to extract orderId from route params
 */
function OrderConfirmationWrapper() {
  const { orderId } = useParams<{ orderId: string }>();
  const orderIdNum = orderId ? parseInt(orderId) : 0;
  
  // Update hash URL for compatibility
  useEffect(() => {
    if (orderId) {
      const hash = `#/order-management/orders/${orderId}/confirmation`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }
  }, [orderId]);

  return <OrderConfirmationPage orderId={orderIdNum} />;
}

/**
 * Phase 5 Routes - Remaining routes
 * 
 * Migrated routes:
 * - /calendar - Calendar page
 * - /appointments - Calendar page (alias)
 * - /tasks - Tasks page
 * - /communications - Client communications page
 * - /talking-points - Talking points page
 * - /announcements - Announcements page
 * - /analytics - Analytics dashboard
 * - /analytics-legacy - Legacy analytics
 * - /products - Products page
 * - /order-management - Order management (lazy loaded)
 * - /orders - Order management alias
 * - /automation - Automation page (lazy loaded)
 * - /sip-builder - SIP builder (lazy loaded)
 * - /sip-manager - SIP builder alias
 * - /sip - SIP builder alias
 * - /qm-portal - QM portal page
 * - /knowledge-profiling - Knowledge profiling (with query params)
 * - /risk-profiling - Risk profiling (with query params)
 * - /clients/:clientId/financial-profile - Add financial profile
 * - /order-management/orders/:orderId/confirmation - Order confirmation
 */
const phase5Routes: RouteObject[] = [
  {
    path: "/calendar",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Calendar />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/appointments",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Calendar />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Tasks />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/communications",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<ClientCommunications />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/talking-points",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<TalkingPoints />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/announcements",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Announcements />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<AnalyticsDashboard />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics-legacy",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Analytics />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/products",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<Products />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/order-management",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OrderManagement />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OrderManagement />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/automation",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <AutomationPage />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sip-builder",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SIPBuilderManager />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sip-manager",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SIPBuilderManager />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sip",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <SIPBuilderManager />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/qm-portal",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<QMPortal />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/knowledge-profiling",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<KnowledgeProfiling />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/risk-profiling",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<RiskProfiling />} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clients/:clientId/financial-profile",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout children={<AddFinancialProfilePage />} />
      </ProtectedRoute>
    ),
    loader: clientLoader,
  },
  {
    path: "/order-management/orders/:orderId/confirmation",
    element: (
      <ProtectedRoute requireAuth={true}>
        <AuthenticatedLayout>
          <Suspense fallback={<LoadingFallback />}>
            <OrderConfirmationWrapper />
          </Suspense>
        </AuthenticatedLayout>
      </ProtectedRoute>
    ),
  },
];

/**
 * All migrated routes
 * Add routes here as they are migrated in each phase
 */
const migratedRoutes: RouteObject[] = [
  ...phase1Routes,
  ...phase2Routes,
  ...phase3Routes,
  ...phase5Routes,
];

/**
 * Create the router instance
 * Using HashRouter to maintain compatibility with existing hash-based URLs
 * 
 * Note: Unmigrated routes will be handled by the old router in App.tsx
 */
export const router = createHashRouter(migratedRoutes);

/**
 * Check if a route has been migrated to React Router
 */
export function isRouteMigrated(path: string): boolean {
  // Remove leading hash and query params for comparison
  const cleanPath = path.replace(/^#/, "").split("?")[0].split("#")[0];
  
  const migratedPaths = [
    // Phase 1
    "/login",
    "/",
    "/help",
    "/help-center",
    "/settings",
    "/profile",
    // Phase 2
    "/clients",
    "/clients/add",
    "/prospects",
    "/prospects/new",
  ];
  
  // Check exact matches first
  if (migratedPaths.includes(cleanPath)) {
    return true;
  }
  
  // Phase 5 routes
  const phase5Paths = [
    "/calendar",
    "/appointments",
    "/tasks",
    "/communications",
    "/talking-points",
    "/announcements",
    "/analytics",
    "/analytics-legacy",
    "/products",
    "/order-management",
    "/orders",
    "/automation",
    "/sip-builder",
    "/sip-manager",
    "/sip",
    "/qm-portal",
    "/knowledge-profiling",
    "/risk-profiling",
  ];
  
  if (phase5Paths.includes(cleanPath)) {
    return true;
  }
  
  // Check Phase 3 & 5 dynamic routes (with parameters)
  const dynamicPatterns = [
    /^\/clients\/\d+$/,                    // /clients/:id
    /^\/clients\/\d+\/personal/,          // /clients/:id/personal
    /^\/clients\/\d+\/portfolio$/,         // /clients/:id/portfolio
    /^\/clients\/\d+\/actions$/,           // /clients/:id/actions
    /^\/clients\/\d+\/interactions$/,      // /clients/:id/interactions
    /^\/clients\/\d+\/transactions$/,      // /clients/:id/transactions
    /^\/clients\/\d+\/communications$/,    // /clients/:id/communications
    /^\/clients\/\d+\/appointments$/,      // /clients/:id/appointments
    /^\/clients\/\d+\/tasks$/,             // /clients/:id/tasks
    /^\/clients\/\d+\/insights$/,          // /clients/:id/insights
    /^\/clients\/\d+\/goals$/,             // /clients/:id/goals
    /^\/clients\/\d+\/financial-profile$/,  // /clients/:id/financial-profile (Phase 5)
    /^\/prospect-detail\/\d+$/,            // /prospect-detail/:id
    /^\/prospect-edit\/\d+$/,              // /prospect-edit/:id
    /^\/order-management\/orders\/\d+\/confirmation$/, // /order-management/orders/:id/confirmation (Phase 5)
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(cleanPath));
}

