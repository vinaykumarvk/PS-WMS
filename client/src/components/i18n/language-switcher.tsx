import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "./language-provider";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const languages = [
  {
    code: "en" as const,
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
  },
  {
    code: "hi" as const,
    label: "Hindi",
    nativeLabel: "हिंदी",
    flag: "🇮🇳",
  },
];

/**
 * Language Switcher Component
 * Allows users to switch between available languages
 */
export function LanguageSwitcher({
  variant = "outline",
  size = "default",
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();

  const currentLanguage = languages.find((lang) => lang.code === language);

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
          aria-label={t("language.selectLanguage")}
          aria-haspopup="true"
          aria-expanded="false"
        >
          <Languages className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{currentLanguage?.nativeLabel || currentLanguage?.label}</span>
          <span className="sr-only">{t("language.selectLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-2 shadow-lg backdrop-blur-sm bg-background/95"
      >
        <DropdownMenuLabel className="font-semibold">
          {t("language.selectLanguage")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => {
          const isActive = language === lang.code;

          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "cursor-pointer transition-colors duration-150",
                "hover:bg-accent/50 focus:bg-accent/50",
                isActive && "bg-accent/30 font-medium"
              )}
              aria-label={`${t("language.selectLanguage")}: ${lang.label}`}
              aria-selected={isActive}
            >
              <span className="mr-2 text-lg" aria-hidden="true">
                {lang.flag}
              </span>
              <span className="flex-1">{lang.nativeLabel}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {lang.label}
              </span>
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
          {t("language.currentLanguage")}: {currentLanguage?.nativeLabel || currentLanguage?.label}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

