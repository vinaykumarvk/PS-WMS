import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { NavigationProvider } from "@/context/navigation-context";
import { DashboardFilterProvider } from "@/context/dashboard-filter-context";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivacyOverlay } from "@/components/PrivacyOverlay";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { SkipLink } from "@/components/accessibility";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import BottomNavigation from "@/components/mobile/BottomNavigation";
import SwipeableView from "@/components/mobile/SwipeableView";
import { useState, useEffect } from "react";
import { isOnline, saveToCache, getFromCache, CACHE_KEYS } from "@/lib/offlineCache";
import { RouterProvider } from "react-router-dom";
import { router, isRouteMigrated } from "./routes";

import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Prospects from "@/pages/prospects";
import AddProspect from "@/pages/add-prospect";
import ProspectDetail from "@/pages/prospect-detail";
import LoginPage from "@/pages/login";

import Analytics from "@/pages/analytics";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import Products from "@/pages/products";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import TalkingPoints from "@/pages/talking-points";
import Announcements from "@/pages/announcements";
import NotFound from "@/pages/not-found";
import ClientActions from "@/pages/client-actions";
import ClientPersonal from "@/pages/client-personal";
import ClientPortfolio from "@/pages/client-portfolio";
import ClientInteractions from "@/pages/client-interactions";
import ClientTransactions from "@/pages/client-transactions";
import ClientCommunications from "@/pages/client-communications";
import ClientAppointments from "@/pages/client-appointments";
import ClientTasks from "@/pages/client-tasks";
import ClientInsights from "@/pages/client-insights";
import ClientGoals from "@/pages/client-goals";
import HelpCenter from "@/pages/help-center";
import AddClientPage from "@/pages/add-client";
import AddFinancialProfilePage from "@/pages/add-financial-profile";
import Tasks from "@/pages/tasks";
import Calendar from "@/pages/calendar";
import QMPortal from "@/pages/qm-portal";
import KnowledgeProfiling from "@/pages/knowledge-profiling";
import RiskProfiling from "@/pages/risk-profiling";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy load heavy order management modules for code splitting
const OrderManagement = lazy(() => import("@/pages/order-management"));
const OrderConfirmationPage = lazy(() => import("@/pages/order-management/components/order-confirmation/order-confirmation-page"));
const AutomationPage = lazy(() => import("@/pages/automation"));
const SIPBuilderManager = lazy(() => import("@/pages/sip-builder-manager"));

// Import hash router hook (extracted for reuse)
import { useHashRouter } from "./hooks/useHashRouter";

function AuthenticatedApp() {
  const currentRoute = useHashRouter();
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Log current route for debugging
  console.log('Current route:', currentRoute);
  
  // Setup offline detection
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  // Cache critical client data for offline use
  useEffect(() => {
    // Only cache data when online
    if (!isOffline) {
      // Set up automatic caching of critical data
      const cacheClients = async () => {
        try {
          const response = await fetch('/api/clients');
          if (response.ok) {
            const clients = await response.json();
            saveToCache(clients, { key: CACHE_KEYS.CLIENTS, expiryInMinutes: 120 });
          }
        } catch (error) {
          console.error('Failed to cache clients:', error);
        }
      };
      
      cacheClients();
    }
  }, [isOffline]);
  
  // Function to handle swipe navigation
  const handleSwipeLeft = () => {
    // Determine next route based on current route
    switch (true) {
      case currentRoute === '/':
        window.location.hash = '/clients';
        break;
      case currentRoute === '/clients':
        window.location.hash = '/prospects';
        break;
      case currentRoute === '/prospects':
        window.location.hash = '/calendar';
        break;
      // Add more cases as needed
    }
  };
  
  const handleSwipeRight = () => {
    // Determine previous route based on current route
    switch (true) {
      case currentRoute === '/clients':
        window.location.hash = '/';
        break;
      case currentRoute === '/prospects':
        window.location.hash = '/clients';
        break;
      case currentRoute === '/calendar':
        window.location.hash = '/prospects';
        break;
      // Add more cases as needed
    }
  };
  
  // Function to render the appropriate component based on the route
  const renderComponent = () => {
    console.log('Rendering component for route:', currentRoute);
    
    // Force scroll to top when rendering any component
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    switch(true) {
      // Migrated routes are handled by React Router - skip them here
      // case currentRoute === '/login': - MIGRATED (Phase 1)
      // case currentRoute === '/': - MIGRATED (Phase 1)
      // case currentRoute === '/clients': - MIGRATED (Phase 2)
      // case currentRoute === '/clients/add': - MIGRATED (Phase 2)
      // case /^\/clients\/\d+\/financial-profile$/: - MIGRATED (Phase 5)
      // Migrated routes are handled by React Router - skip them here
      // case currentRoute === '/prospects': - MIGRATED (Phase 2)
      // case currentRoute === '/prospects/new': - MIGRATED (Phase 2)
      // Dynamic routes migrated in Phase 3:
      // case /^\/prospect-detail\/\d+$/: - MIGRATED (Phase 3)
      // case /^\/prospect-edit\/\d+$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/actions$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/personal/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/portfolio$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/interactions$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/transactions$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/communications$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/appointments$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/tasks$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/insights$/: - MIGRATED (Phase 3)
      // case /^\/clients\/\d+\/goals$/: - MIGRATED (Phase 3)
      case /^\/client-insights\/\d+$/.test(currentRoute):
        // Legacy route - redirect to new format
        const legacyClientId = currentRoute.match(/\/client-insights\/(\d+)/)?.[1];
        if (legacyClientId) {
          window.location.hash = `/clients/${legacyClientId}/insights`;
          return null;
        }
        return <ClientInsights />;
      case /^\/clients\/\d+\/portfolio-report$/.test(currentRoute):
        // Extract client ID and open portfolio report
        const clientIdMatch = currentRoute.match(/\/clients\/(\d+)\/portfolio-report/);
        if (clientIdMatch) {
          const clientId = clientIdMatch[1];
          window.open(`/api/clients/${clientId}/portfolio-report`, '_blank');
          // Navigate back to portfolio page
          setTimeout(() => {
            window.location.hash = `/clients/${clientId}/portfolio`;
          }, 100);
        }
        return <ClientPortfolio />;
      
      // Phase 5 routes migrated to React Router - skip them here
      // case currentRoute === '/calendar': - MIGRATED (Phase 5)
      // case currentRoute === '/appointments': - MIGRATED (Phase 5)
      // case currentRoute === '/tasks': - MIGRATED (Phase 5)
      // case currentRoute === '/communications': - MIGRATED (Phase 5)
      // case currentRoute === '/talking-points': - MIGRATED (Phase 5)
      // case currentRoute === '/announcements': - MIGRATED (Phase 5)
      // case currentRoute === '/analytics': - MIGRATED (Phase 5)
      // case currentRoute === '/analytics-legacy': - MIGRATED (Phase 5)
      // case currentRoute === '/products': - MIGRATED (Phase 5)
      // case currentRoute === '/order-management': - MIGRATED (Phase 5)
      // case currentRoute === '/orders': - MIGRATED (Phase 5)
      // case currentRoute === '/automation': - MIGRATED (Phase 5)
      // case /^\/order-management\/orders\/\d+\/confirmation$/: - MIGRATED (Phase 5)
      // case currentRoute === '/sip-builder': - MIGRATED (Phase 5)
      // case currentRoute === '/sip-manager': - MIGRATED (Phase 5)
      // case currentRoute === '/sip': - MIGRATED (Phase 5)
      // case currentRoute === '/qm-portal': - MIGRATED (Phase 5)
      // case /^\/knowledge-profiling(\?.*)?$/: - MIGRATED (Phase 5)
      // case /^\/risk-profiling(\?.*)?$/: - MIGRATED (Phase 5)
      // Migrated routes are handled by React Router - skip them here
      // case currentRoute === '/settings': - MIGRATED
      // case currentRoute === '/profile': - MIGRATED
      // case currentRoute === '/help': - MIGRATED
      // case currentRoute === '/help-center': - MIGRATED
      default:
        return <NotFound />;
    }
  };
  
  // Check if we're on QM portal route - hide sidebar and profile picture
  const isQMPortal = currentRoute === '/qm-portal';
  
  return (
    <div className="flex h-screen overflow-hidden">
      {!isQMPortal && <Sidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          hideProfilePicture={isQMPortal}
          hideSidebar={isQMPortal}
        />
        
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-accent text-accent-foreground p-2 text-center text-sm font-medium">
            You are currently offline. Some features may be limited.
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto bg-background pb-mobile-nav" id="main-content">
          {renderComponent()}
        </main>
        
        {!isQMPortal && (
          <BottomNavigation 
            onMoreClick={() => setIsMobileMenuOpen(true)}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, isLoading } = useAuth();
  const currentRoute = useHashRouter();
  const routeIsMigrated = isRouteMigrated(window.location.hash || "#/");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // If route is migrated to React Router, use RouterProvider
  if (routeIsMigrated) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <AccessibilityProvider>
              <NavigationProvider>
                <DashboardFilterProvider>
                  <SkipLink />
                  <Toaster />
                  <RouterProvider router={router} />
                  <PrivacyOverlay />
                  {user && <OnboardingTour />}
                </DashboardFilterProvider>
              </NavigationProvider>
            </AccessibilityProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Otherwise, use old router
  // If not authenticated and not on login page, redirect to login
  if (!user && currentRoute !== '/login') {
    window.location.hash = '/login';
    return null;
  }

  // If authenticated and on login page, redirect based on role
  if (user && currentRoute === '/login') {
    // Redirect QM users to QM portal, others to dashboard
    if (user.role === 'Question Manager' || user.role === 'question_manager') {
      window.location.hash = '/qm-portal';
    } else {
      window.location.hash = '/';
    }
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AccessibilityProvider>
            <NavigationProvider>
              <DashboardFilterProvider>
                <SkipLink />
                <Toaster />
                {user ? <AuthenticatedApp /> : <LoginPage />}
                <PrivacyOverlay />
                {user && <OnboardingTour />}
              </DashboardFilterProvider>
            </NavigationProvider>
          </AccessibilityProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
