import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ScenarioFilter = 
  | 'expiring-kyc'
  | 'overdue-tasks'
  | 'high-value-opportunities'
  | 'clients-needing-attention'
  | 'upcoming-reviews'
  | 'critical-alerts';

interface DashboardFilterContextType {
  activeFilters: Set<ScenarioFilter>;
  toggleFilter: (filter: ScenarioFilter) => void;
  clearFilters: () => void;
  hasFilter: (filter: ScenarioFilter) => boolean;
  filterCount: number;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

const FILTER_STORAGE_KEY = 'dashboard-scenario-filters';

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [activeFilters, setActiveFilters] = useState<Set<ScenarioFilter>>(new Set());

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        const filters = JSON.parse(stored) as ScenarioFilter[];
        setActiveFilters(new Set(filters));
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(activeFilters)));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [activeFilters]);

  const toggleFilter = (filter: ScenarioFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  const hasFilter = (filter: ScenarioFilter) => {
    return activeFilters.has(filter);
  };

  const filterCount = activeFilters.size;

  return (
    <DashboardFilterContext.Provider
      value={{
        activeFilters,
        toggleFilter,
        clearFilters,
        hasFilter,
        filterCount,
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}

