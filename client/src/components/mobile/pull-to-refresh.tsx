import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
  className?: string;
  pullDownContent?: ReactNode;
  releaseContent?: ReactNode;
  refreshContent?: ReactNode;
}

const DEFAULT_THRESHOLD = 80;

export function PullToRefresh({
  children,
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
  className = '',
  pullDownContent,
  releaseContent,
  refreshContent,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);
  const isMobile = useIsMobile();

  // Check if we can pull (user is at top of scroll)
  useEffect(() => {
    const checkCanPull = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setCanPull(scrollTop === 0);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkCanPull);
      checkCanPull();
      return () => container.removeEventListener('scroll', checkCanPull);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !isMobile || !canPull || isRefreshing) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isMobile || !isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    // Only allow pulling down
    if (distance > 0 && canPull) {
      // Add resistance after threshold
      const resistance = distance > threshold ? 0.3 : 1;
      const pullAmount = distance * resistance;
      setPullDistance(Math.min(pullAmount, threshold * 1.5));
      
      // Prevent default scrolling when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isMobile || !isPulling || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Spring back
      setPullDistance(0);
    }

    setIsPulling(false);
    setStartY(0);
  };

  // Animate pull distance
  useEffect(() => {
    if (!isPulling && !isRefreshing && pullDistance > 0) {
      const timer = setTimeout(() => {
        setPullDistance(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isPulling, isRefreshing, pullDistance]);

  const isPastThreshold = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isMobile ? `translateY(${pullDistance}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            transform: `translateY(-${Math.min(pullDistance, threshold)}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isRefreshing ? (
              <>
                {refreshContent || (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Refreshing...</span>
                  </>
                )}
              </>
            ) : isPastThreshold ? (
              <>
                {releaseContent || (
                  <>
                    <Loader2 className="h-6 w-6 text-primary" />
                    <span className="text-sm text-muted-foreground">Release to refresh</span>
                  </>
                )}
              </>
            ) : (
              <>
                {pullDownContent || (
                  <>
                    <Loader2 className="h-6 w-6 text-muted-foreground" style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
                    <span className="text-sm text-muted-foreground">Pull down to refresh</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

