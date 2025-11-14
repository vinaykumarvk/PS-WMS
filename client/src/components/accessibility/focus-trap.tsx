import { useEffect, useRef, ReactNode } from "react";
import { useAccessibilityEnhanced } from "@/hooks/use-accessibility";

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * Focus Trap Component
 * Traps focus within a container (useful for modals, dialogs)
 */
export function FocusTrap({
  children,
  active = true,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus } = useAccessibilityEnhanced();

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const cleanup = trapFocus(containerRef.current);
    return cleanup;
  }, [active, trapFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

