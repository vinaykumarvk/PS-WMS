import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data cache
const translationCache: Record<Language, Record<string, any> | null> = {
  en: null,
  hi: null,
};

/**
 * Language Provider Component
 * Manages language state and provides translation function
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("wealthrm-language") as Language;
    return saved || "en";
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load translation file
  const loadTranslations = useCallback(async (lang: Language) => {
    if (translationCache[lang]) {
      return translationCache[lang];
    }

    setIsLoading(true);
    try {
      // Dynamic import with proper path resolution
      const translations = await import(`../../../../shared/locales/${lang}.json`);
      translationCache[lang] = translations.default;
      return translations.default;
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to English if translation file doesn't exist
      if (lang !== "en") {
        const enTranslations = await import(`../../../../shared/locales/en.json`);
        return enTranslations.default;
      }
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preload current language translations
  useEffect(() => {
    loadTranslations(language);
  }, [language, loadTranslations]);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translations = translationCache[language];
      if (!translations) {
        return key; // Return key if translations not loaded
      }

      // Navigate through nested keys (e.g., "common.save")
      const keys = key.split(".");
      let value: any = translations;
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      // Replace parameters in translation string
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    },
    [language]
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wealthrm-language", lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  }, []);

  // Set HTML lang attribute on mount and language change
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useI18n() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}

