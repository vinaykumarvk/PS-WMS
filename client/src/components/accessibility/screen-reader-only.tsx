import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenReaderOnlyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Screen Reader Only Component
 * Hides content visually but keeps it accessible to screen readers
 */
export function ScreenReaderOnly({
  children,
  className,
}: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn(
        "sr-only",
        className
      )}
    >
      {children}
    </span>
  );
}

