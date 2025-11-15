/**
 * Navigation Utilities
 * 
 * Provides a unified navigation API that works with both React Router and hash router
 */

/**
 * Navigate to a route
 * Works with both React Router (for migrated routes) and hash router (for unmigrated routes)
 */
export function navigateTo(path: string) {
  // Remove leading slash if present (HashRouter handles it)
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Use hash navigation (works for both routers since we're using HashRouter)
  window.location.hash = cleanPath;
}

/**
 * Check if current route matches a path
 */
export function isCurrentRoute(path: string): boolean {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return hash === cleanPath || hash.startsWith(`${cleanPath}/`);
}

