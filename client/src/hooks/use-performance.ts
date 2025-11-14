import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useIsMobile } from './use-mobile';

/**
 * Hook to optimize performance on mobile devices
 */
export function usePerformanceOptimizations() {
  const isMobile = useIsMobile();
  const rafId = useRef<number | null>(null);

  // Debounce function for mobile
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Throttle function for mobile
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }, []);

  // Request animation frame wrapper
  const requestAnimationFrame = useCallback((callback: () => void) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = window.requestAnimationFrame(callback);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return {
    debounce,
    throttle,
    requestAnimationFrame,
    isMobile,
  };
}

/**
 * Hook to lazy load images on mobile
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!src) return;

    // On mobile, use Intersection Observer for lazy loading
    if (isMobile && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = new Image();
              img.src = src;
              img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
              };
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    } else {
      // On desktop, load immediately
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
    }
  }, [src, isMobile]);

  return { imageSrc, isLoaded, imgRef };
}

/**
 * Hook to detect and handle slow network connections
 */
export function useNetworkStatus() {
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // @ts-ignore - connection API may not be available
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const updateConnectionStatus = () => {
      if (connection) {
        // @ts-ignore
        const effectiveType = connection.effectiveType;
        // @ts-ignore
        const downlink = connection.downlink;
        
        // Consider 2g/3g or slow 4g as slow connection
        setIsSlowConnection(
          effectiveType === '2g' ||
          effectiveType === '3g' ||
          (effectiveType === '4g' && downlink < 1.5)
        );
      }
      setIsOnline(navigator.onLine);
    };

    updateConnectionStatus();

    if (connection) {
      connection.addEventListener('change', updateConnectionStatus);
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    return () => {
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  return { isSlowConnection, isOnline };
}

