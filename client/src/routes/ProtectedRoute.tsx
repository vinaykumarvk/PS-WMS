/**
 * Protected Route Component
 * 
 * Handles authentication redirects for React Router routes
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Protected Route - redirects based on authentication status
 */
export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      // Redirect to login if not authenticated
      navigate("/login", { replace: true });
    } else if (!requireAuth && user) {
      // Redirect authenticated users away from login page
      // Use window.location.hash for unmigrated routes like /qm-portal
      if (user.role === "Question Manager" || user.role === "question_manager") {
        // /qm-portal is not migrated yet, use hash navigation
        window.location.hash = "/qm-portal";
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, isLoading, requireAuth, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show children if auth state matches requirements
  if (requireAuth && !user) {
    return null; // Will redirect
  }

  if (!requireAuth && user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

