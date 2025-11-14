import { useAccessibilityEnhanced } from "@/hooks/use-accessibility";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Skip Link Component
 * Provides keyboard-accessible skip navigation link
 */
export function SkipLink({
  href = "#main-content",
  className,
  children = "Skip to main content",
}: SkipLinkProps) {
  const { skipToMain } = useAccessibilityEnhanced();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    skipToMain();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </a>
  );
}

