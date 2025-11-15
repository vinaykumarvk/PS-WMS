/**
 * Layout Components for React Router
 * 
 * These layouts wrap routes and provide shared UI elements like Sidebar and Header
 */

import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import BottomNavigation from "@/components/mobile/BottomNavigation";
import { isOnline, saveToCache, CACHE_KEYS } from "@/lib/offlineCache";

/**
 * Authenticated Layout
 * Wraps authenticated routes with Sidebar, Header, and mobile navigation
 */
export function AuthenticatedLayout({ children }: { children?: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Setup offline detection
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  // Cache critical client data for offline use
  useEffect(() => {
    if (!isOffline) {
      const cacheClients = async () => {
        try {
          const response = await fetch("/api/clients");
          if (response.ok) {
            const clients = await response.json();
            saveToCache(clients, { key: CACHE_KEYS.CLIENTS, expiryInMinutes: 120 });
          }
        } catch (error) {
          console.error("Failed to cache clients:", error);
        }
      };

      cacheClients();
    }
  }, [isOffline]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  // Check if we're on QM portal route - hide sidebar and profile picture
  const isQMPortal = location.pathname === "/qm-portal";

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
          {children || <Outlet />}
        </main>

        {!isQMPortal && (
          <BottomNavigation onMoreClick={() => setIsMobileMenuOpen(true)} />
        )}
      </div>
    </div>
  );
}

/**
 * Public Layout
 * For unauthenticated routes like login
 */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}

