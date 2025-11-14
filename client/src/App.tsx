import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { NavigationProvider } from "@/context/navigation-context";
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

// Custom router implementation using hash-based routing
function useHashRouter() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    // Always ensure we start with hash-based routing
    const hash = window.location.hash.replace(/^#/, '');
    const pathname = window.location.pathname;
    
    // If we have a pathname but no hash, move the pathname to hash
    if (pathname && pathname !== '/' && !hash) {
      window.location.replace('#' + pathname);
      return pathname;
    }
    
    // Strip query parameters from initial hash for route matching
    const [routePath] = (hash || '/').split('?');
    return routePath || '/';
  });
  
  useEffect(() => {
    // Disable scroll restoration for hash navigation
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Set initial hash if it's empty
    if (!window.location.hash) {
      window.location.hash = '/';
    }
    
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace(/^#/, '') || '/';
      console.log('Hash changed to:', fullHash);
      
      // Separate route path from fragment (e.g., "/clients/3/portfolio#action-items" -> "/clients/3/portfolio")
      const [pathWithQuery, fragment] = fullHash.split('#');
      
      // Strip query parameters from path for route matching (e.g., "/clients/3/personal?section=family" -> "/clients/3/personal")
      const [routePath] = pathWithQuery.split('?');
      const cleanRoutePath = routePath || '/';
      
      // Scroll both window and main container only if no fragment (don't interfere with section scrolling)
      if (!fragment) {
        const scrollToTop = () => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.scrollTop = 0;
          }
        };
        
        // Immediate scroll
        scrollToTop();
        
        // Multiple delayed attempts to override any browser restoration
        setTimeout(scrollToTop, 10);
        setTimeout(scrollToTop, 50);
        setTimeout(scrollToTop, 100);
        setTimeout(scrollToTop, 200);
      }
      
      setCurrentRoute(cleanRoutePath);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  return currentRoute;
}

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
      case currentRoute === '/login':
        return <LoginPage />;
      case currentRoute === '/':
        return <Dashboard />;
      case currentRoute === '/clients':
        return <Clients />;
      case currentRoute === '/clients/add':
        return <AddClientPage />;
      case /^\/clients\/\d+\/financial-profile$/.test(currentRoute):
        return <AddFinancialProfilePage />;
      case currentRoute === '/prospects':
        return <Prospects />;
      case currentRoute === '/prospects/new':
        return <AddProspect />;
      case /^\/prospect-detail\/\d+$/.test(currentRoute):
        const prospectId = parseInt(currentRoute.split('/')[2]);
        return <AddProspect prospectId={prospectId} readOnly={true} />;
      case /^\/prospect-edit\/\d+$/.test(currentRoute):
        const editProspectId = parseInt(currentRoute.split('/')[2]);
        return <AddProspect prospectId={editProspectId} readOnly={false} />;
        
      // Client detail pages
      case /^\/clients\/\d+$/.test(currentRoute):
        // When clicking a client, default to personal info page
        return <ClientPersonal />;
      case /^\/clients\/\d+\/actions$/.test(currentRoute):
        return <ClientActions />;
      case /^\/clients\/\d+\/personal/.test(currentRoute):
        return <ClientPersonal />;
      case /^\/clients\/\d+\/portfolio$/.test(currentRoute):
        return <ClientPortfolio />;
      case /^\/clients\/\d+\/interactions$/.test(currentRoute):
        return <ClientInteractions />;
      case /^\/clients\/\d+\/transactions$/.test(currentRoute):
        return <ClientTransactions />;
      case /^\/clients\/\d+\/communications$/.test(currentRoute):
        return <ClientCommunications />;
      case /^\/clients\/\d+\/appointments$/.test(currentRoute):
        return <ClientAppointments />;
      case /^\/clients\/\d+\/tasks$/.test(currentRoute):
        return <ClientTasks />;
      case /^\/clients\/\d+\/insights$/.test(currentRoute):
        return <ClientInsights />;
      case /^\/clients\/\d+\/goals$/.test(currentRoute):
        return <ClientGoals />;
      case /^\/client-insights\/\d+$/.test(currentRoute):
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
      
      case currentRoute === '/calendar':
        return <Calendar />;
      case currentRoute === '/appointments':
        return <Calendar />;
      case currentRoute === '/tasks':
        return <Tasks />;
      case currentRoute === '/communications':
        return <ClientCommunications />;
      case currentRoute === '/talking-points':
        return <TalkingPoints />;
      case currentRoute === '/announcements':
        return <Announcements />;
      case currentRoute === '/analytics':
        return <AnalyticsDashboard />;
      case currentRoute === '/analytics-legacy':
        return <Analytics />;
      case currentRoute === '/products':
        return <Products />;
      case currentRoute === '/order-management':
      case currentRoute === '/orders':
        return (
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <OrderManagement />
          </Suspense>
        );
      case currentRoute === '/automation':
        return (
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <AutomationPage />
          </Suspense>
        );
      case /^\/order-management\/orders\/\d+\/confirmation$/.test(currentRoute):
        const orderId = parseInt(currentRoute.split('/')[3]);
        return (
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <OrderConfirmationPage orderId={orderId} />
          </Suspense>
        );
      case currentRoute === '/sip-builder':
      case currentRoute === '/sip-manager':
      case currentRoute === '/sip':
        return (
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <SIPBuilderManager />
          </Suspense>
        );
      case currentRoute === '/qm-portal':
        return <QMPortal />;
      case /^\/knowledge-profiling(\?.*)?$/.test(currentRoute):
        return <KnowledgeProfiling />;
      case /^\/risk-profiling(\?.*)?$/.test(currentRoute):
        return <RiskProfiling />;
      case currentRoute === '/settings':
        return <Settings />;
      case currentRoute === '/profile':
        return <Profile />;
      case currentRoute === '/help':
      case currentRoute === '/help-center':
        return <HelpCenter />;
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
              <SkipLink />
              <Toaster />
              {user ? <AuthenticatedApp /> : <LoginPage />}
              <PrivacyOverlay />
              {user && <OnboardingTour />}
            </NavigationProvider>
          </AccessibilityProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
