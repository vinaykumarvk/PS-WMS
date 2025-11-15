import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type BriefingTone = "professional" | "friendly" | "direct";
export type BriefingDepth = "concise" | "standard" | "comprehensive";

export interface BriefingPreferences {
  tone: BriefingTone;
  depth: BriefingDepth;
}

interface PreferencesContextValue {
  preferences: BriefingPreferences;
  updatePreferences: (updates: Partial<BriefingPreferences>) => void;
}

const DEFAULT_PREFERENCES: BriefingPreferences = {
  tone: "professional",
  depth: "standard"
};

const STORAGE_KEY = "wealth-rm-briefing-preferences";

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<BriefingPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          tone: parsed.tone as BriefingTone ?? DEFAULT_PREFERENCES.tone,
          depth: parsed.depth as BriefingDepth ?? DEFAULT_PREFERENCES.depth
        };
      }
    } catch (error) {
      console.warn("Failed to load briefing preferences, using defaults", error);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn("Failed to persist briefing preferences", error);
    }
  }, [preferences]);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    updatePreferences: (updates: Partial<BriefingPreferences>) => {
      setPreferences((prev) => ({
        ...prev,
        ...updates
      }));
    }
  }), [preferences]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useUserPreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a PreferencesProvider");
  }
  return context;
}
