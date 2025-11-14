/**
 * Example component demonstrating mobile optimizations
 * This can be used as a reference for implementing mobile features in pages
 */

import React from 'react';
import { PullToRefresh } from './pull-to-refresh';
import SwipeableView from './SwipeableView';
import { useIsMobile, useDeviceType, useOrientation } from '@/hooks/use-mobile';
import { usePerformanceOptimizations, useNetworkStatus } from '@/hooks/use-performance';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface MobileOptimizedPageProps {
  children: React.ReactNode;
  enablePullToRefresh?: boolean;
  enableSwipeNavigation?: boolean;
  onRefresh?: () => Promise<void>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * Wrapper component that applies mobile optimizations to a page
 * 
 * Features:
 * - Pull-to-refresh (optional)
 * - Swipe navigation (optional)
 * - Mobile-aware rendering
 * - Performance optimizations
 * - Network-aware loading
 */
export function MobileOptimizedPage({
  children,
  enablePullToRefresh = false,
  enableSwipeNavigation = false,
  onRefresh,
  onSwipeLeft,
  onSwipeRight,
}: MobileOptimizedPageProps) {
  const isMobile = useIsMobile();
  const deviceType = useDeviceType();
  const orientation = useOrientation();
  const { isSlowConnection, isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  // Default refresh handler
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      // Invalidate all queries by default
      await queryClient.invalidateQueries();
    }
  };

  // Show loading state for slow connections
  if (isSlowConnection && !isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Slow connection detected. Loading optimized content...
        </p>
      </div>
    );
  }

  // Wrap content with mobile optimizations
  let content = <>{children}</>;

  // Add swipe navigation if enabled
  if (enableSwipeNavigation && (onSwipeLeft || onSwipeRight)) {
    content = (
      <SwipeableView
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        enableHorizontal={true}
        enableVertical={false}
      >
        {content}
      </SwipeableView>
    );
  }

  // Add pull-to-refresh if enabled
  if (enablePullToRefresh) {
    content = (
      <PullToRefresh onRefresh={handleRefresh}>
        {content}
      </PullToRefresh>
    );
  }

  // Apply mobile-specific classes
  return (
    <div
      className={`mobile-optimized-page ${
        isMobile ? 'mobile-layout' : 'desktop-layout'
      } device-${deviceType} orientation-${orientation}`}
    >
      {content}
    </div>
  );
}

/**
 * Hook to get mobile-optimized query options
 * Automatically adjusts staleTime and cacheTime based on device and network
 */
export function useMobileOptimizedQuery<TData = any>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { isSlowConnection } = useNetworkStatus();
  const isMobile = useIsMobile();

  // Adjust query options for mobile/slow connections
  const mobileOptions = {
    staleTime: isSlowConnection ? 5 * 60 * 1000 : 1 * 60 * 1000, // 5 min vs 1 min
    cacheTime: isSlowConnection ? 30 * 60 * 1000 : 10 * 60 * 1000, // 30 min vs 10 min
    ...options,
  };

  return useQuery({
    queryKey,
    queryFn,
    ...mobileOptions,
  });
}

