/**
 * Hash Router Hook
 * 
 * Extracted from App.tsx for reuse
 * This hook will be gradually replaced by React Router's useLocation
 */

import { useState, useEffect } from "react";

export function useHashRouter() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    // Always ensure we start with hash-based routing
    const hash = window.location.hash.replace(/^#/, "");
    const pathname = window.location.pathname;

    // If we have a pathname but no hash, move the pathname to hash
    if (pathname && pathname !== "/" && !hash) {
      window.location.replace("#" + pathname);
      return pathname;
    }

    // Strip query parameters from initial hash for route matching
    const [routePath] = (hash || "/").split("?");
    return routePath || "/";
  });

  useEffect(() => {
    // Disable scroll restoration for hash navigation
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Set initial hash if it's empty
    if (!window.location.hash) {
      window.location.hash = "/";
    }

    const handleHashChange = () => {
      const fullHash = window.location.hash.replace(/^#/, "") || "/";
      console.log("Hash changed to:", fullHash);

      // Separate route path from fragment (e.g., "/clients/3/portfolio#action-items" -> "/clients/3/portfolio")
      const [pathWithQuery, fragment] = fullHash.split("#");

      // Strip query parameters from path for route matching (e.g., "/clients/3/personal?section=family" -> "/clients/3/personal")
      const [routePath] = pathWithQuery.split("?");
      const cleanRoutePath = routePath || "/";

      // Scroll both window and main container only if no fragment (don't interfere with section scrolling)
      if (!fragment) {
        const scrollToTop = () => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const mainContent = document.getElementById("main-content");
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

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return currentRoute;
}

