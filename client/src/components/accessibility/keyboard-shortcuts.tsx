import { useEffect, ReactNode } from "react";
import { useAccessibilityEnhanced } from "@/hooks/use-accessibility";

interface KeyboardShortcut {
  shortcut: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  children: ReactNode;
}

/**
 * Keyboard Shortcuts Component
 * Registers keyboard shortcuts for accessibility
 */
export function KeyboardShortcuts({
  shortcuts,
  children,
}: KeyboardShortcutsProps) {
  const { handleKeyboardShortcut } = useAccessibilityEnhanced();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ shortcut, action }) => {
        handleKeyboardShortcut(e, shortcut, action);
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, handleKeyboardShortcut]);

  return <>{children}</>;
}

