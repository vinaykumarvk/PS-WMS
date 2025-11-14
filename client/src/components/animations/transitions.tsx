import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TransitionProps {
  children: ReactNode;
  show?: boolean;
  duration?: number;
  className?: string;
  unmountOnExit?: boolean;
}

/**
 * Transition Component
 * Provides smooth show/hide transitions
 */
export function Transition({
  children,
  show = true,
  duration = 300,
  className,
  unmountOnExit = false,
}: TransitionProps) {
  if (unmountOnExit && !show) {
    return null;
  }

  return (
    <div
      className={cn(
        "transition-all ease-in-out",
        show ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
      aria-hidden={!show}
    >
      {children}
    </div>
  );
}

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page Transition Component
 * Provides smooth page transitions
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

/**
 * Stagger Children Component
 * Applies staggered animation delays to children
 */
export function StaggerChildren({
  children,
  staggerDelay = 100,
  className,
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                animationDelay: `${index * staggerDelay}ms`,
              }}
              className="animate-in fade-in slide-in-from-bottom-2"
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

