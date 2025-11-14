import { useTheme as useThemeProvider } from "@/components/theme-provider";

type Theme = "light" | "dark" | "primesoft";

/**
 * Enhanced theme hook with additional utilities
 * Provides theme state and helper functions for theme management
 */
export function useTheme() {
  const { theme, setTheme } = useThemeProvider();

  // Get the actual resolved theme (light or dark, not primesoft)
  const resolvedTheme = (): "light" | "dark" => {
    if (theme === "primesoft") {
      return "light"; // Primesoft theme is treated as light variant
    }
    return theme as "light" | "dark";
  };

  // Check if dark mode is active
  const isDark = resolvedTheme() === "dark";

  // Toggle between light and dark
  const toggleTheme = () => {
    const current = resolvedTheme();
    setTheme(current === "dark" ? "light" : "dark");
  };

  return {
    theme,
    setTheme,
    resolvedTheme: resolvedTheme(),
    isDark,
    toggleTheme,
  };
}

