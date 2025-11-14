import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Enhanced theme toggle component with better UX
 * Supports light, dark, and primesoft theme options
 */
export function ThemeToggle({
  variant = "outline",
  size = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Light theme",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Dark theme",
    },
    {
      value: "primesoft" as const,
      label: "PrimeSoft Brand",
      icon: Palette,
      description: "PrimeSoft brand theme",
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className
          )}
          aria-label="Toggle theme"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-2 shadow-lg backdrop-blur-sm bg-background/95"
      >
        <DropdownMenuLabel className="font-semibold">
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "cursor-pointer transition-colors duration-150",
                "hover:bg-accent/50 focus:bg-accent/50",
                isActive && "bg-accent/30 font-medium"
              )}
              aria-label={themeOption.description}
              aria-selected={isActive}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="flex-1">{themeOption.label}</span>
              {isActive && (
                <div
                  className="ml-auto h-2 w-2 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Current: {theme === "primesoft" ? "PrimeSoft" : resolvedTheme === "dark" ? "Dark" : "Light"} mode
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

