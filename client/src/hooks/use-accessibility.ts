import { useAccessibility } from "@/context/AccessibilityContext";
import { useEffect, useCallback } from "react";

/**
 * Enhanced accessibility hook with additional utilities
 * Provides accessibility state and helper functions
 */
export function useAccessibilityEnhanced() {
  const {
    highContrastMode,
    toggleHighContrastMode,
    screenReaderOptimized,
    toggleScreenReaderOptimized,
  } = useAccessibility();

  // Focus management utilities
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTab);
    };
  }, []);

  // Skip to main content
  const skipToMain = useCallback(() => {
    focusElement("main, [role='main'], #main-content");
  }, [focusElement]);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Keyboard shortcuts handler
  const handleKeyboardShortcut = useCallback(
    (e: KeyboardEvent, shortcut: string, callback: () => void) => {
      const keys = shortcut.toLowerCase().split("+").map((k) => k.trim());
      const ctrl = keys.includes("ctrl") || keys.includes("cmd");
      const shift = keys.includes("shift");
      const alt = keys.includes("alt");
      const key = keys[keys.length - 1];

      if (
        (ctrl && (e.ctrlKey || e.metaKey)) === ctrl &&
        e.shiftKey === shift &&
        e.altKey === alt &&
        e.key.toLowerCase() === key
      ) {
        e.preventDefault();
        callback();
      }
    },
    []
  );

  return {
    highContrastMode,
    toggleHighContrastMode,
    screenReaderOptimized,
    toggleScreenReaderOptimized,
    focusElement,
    trapFocus,
    skipToMain,
    announce,
    handleKeyboardShortcut,
  };
}

