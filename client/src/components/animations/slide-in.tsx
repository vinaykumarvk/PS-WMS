import { ReactNode, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
  trigger?: "mount" | "scroll";
}

/**
 * SlideIn Animation Component
 * Provides slide-in animation with optional scroll trigger
 */
export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  duration = 600,
  className,
  distance = 100,
  trigger = "mount",
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(trigger === "mount");
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === "mount") {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Scroll trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, trigger]);

  const getInitialTransform = () => {
    switch (direction) {
      case "left":
        return `translateX(-${distance}px)`;
      case "right":
        return `translateX(${distance}px)`;
      case "up":
        return `translateY(${distance}px)`;
      case "down":
        return `translateY(-${distance}px)`;
      default:
        return "translateX(0)";
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn("transition-all ease-out", className)}
      style={{
        transitionDuration: `${duration}ms`,
        transform: isVisible ? "translate(0, 0)" : getInitialTransform(),
        opacity: isVisible ? 1 : 0,
      }}
      aria-hidden="false"
    >
      {children}
    </div>
  );
}

