import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}

/**
 * FadeIn Animation Component
 * Provides smooth fade-in animation with optional directional movement
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  className,
  direction = "none",
  distance = 20,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (direction === "none") return "translate(0, 0)";
    if (direction === "up") return `translateY(${distance}px)`;
    if (direction === "down") return `translateY(-${distance}px)`;
    if (direction === "left") return `translateX(${distance}px)`;
    if (direction === "right") return `translateX(-${distance}px)`;
    return "translate(0, 0)";
  };

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transform: isVisible ? "translate(0, 0)" : getTransform(),
      }}
      aria-hidden="false"
    >
      {children}
    </div>
  );
}

