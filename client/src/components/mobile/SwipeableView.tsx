import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile, useTouchDevice } from '@/hooks/use-mobile';

interface SwipeableViewProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
  enableVertical?: boolean;
  enableHorizontal?: boolean;
  preventScrollOnSwipe?: boolean;
}

const SwipeableView: React.FC<SwipeableViewProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
  disabled = false,
  enableVertical = false,
  enableHorizontal = true,
  preventScrollOnSwipe = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);

  // Only enable on mobile/touch devices
  const shouldEnable = (isMobile || isTouchDevice) && !disabled;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!shouldEnable) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
    setSwipeDirection(null);
  }, [shouldEnable]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!shouldEnable || !isSwiping || !touchStart) return;
    
    const touch = e.touches[0];
    const currentEnd = { x: touch.clientX, y: touch.clientY };
    setTouchEnd(currentEnd);
    
    const deltaX = currentEnd.x - touchStart.x;
    const deltaY = currentEnd.y - touchStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Determine swipe direction on first significant movement
    if (!swipeDirection && (absX > 10 || absY > 10)) {
      if (absX > absY && enableHorizontal) {
        setSwipeDirection('horizontal');
      } else if (absY > absX && enableVertical) {
        setSwipeDirection('vertical');
      }
    }
    
    // Only apply visual feedback for the determined direction
    if (swipeDirection === 'horizontal' && enableHorizontal) {
      setSwipeOffset({ x: deltaX, y: 0 });
      
      // Add visual feedback
      if (containerRef.current && absX > 10) {
        const resistance = absX > threshold ? 0.3 : 0.5;
        containerRef.current.style.transform = `translateX(${deltaX * resistance}px)`;
        containerRef.current.style.transition = 'none';
        
        // Prevent scrolling if swiping horizontally
        if (preventScrollOnSwipe && absX > absY) {
          e.preventDefault();
        }
      }
    } else if (swipeDirection === 'vertical' && enableVertical) {
      setSwipeOffset({ x: 0, y: deltaY });
      
      // Add visual feedback
      if (containerRef.current && absY > 10) {
        const resistance = absY > threshold ? 0.3 : 0.5;
        containerRef.current.style.transform = `translateY(${deltaY * resistance}px)`;
        containerRef.current.style.transition = 'none';
      }
    }
  }, [shouldEnable, isSwiping, touchStart, swipeDirection, enableHorizontal, enableVertical, threshold, preventScrollOnSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!shouldEnable || !touchStart || !touchEnd) return;
    
    // Reset the transform
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Determine if swipe is significant
    if (swipeDirection === 'horizontal' && absX > threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    } else if (swipeDirection === 'vertical' && absY > threshold) {
      if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      }
    }
    
    // Reset state
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    
    // Reset transition after animation
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = '';
      }
    }, 300);
  }, [shouldEnable, touchStart, touchEnd, swipeDirection, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.style.transform = '';
        containerRef.current.style.transition = '';
      }
    };
  }, []);

  if (!shouldEnable) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: preventScrollOnSwipe && swipeDirection === 'horizontal' ? 'pan-y' : 'auto',
      }}
    >
      {children}
    </div>
  );
};

export default SwipeableView;