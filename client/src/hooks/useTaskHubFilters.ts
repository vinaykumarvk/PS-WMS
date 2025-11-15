/**
 * Task Hub Filters Hook
 * Phase 3: Filtering & Search Enhancement
 * 
 * Manages filter state, URL query parameters, and localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { UnifiedFeedFilters } from './useTaskHub';

const FILTER_STORAGE_KEY = 'task-hub-filters';

export function useTaskHubFilters() {
  const [filters, setFilters] = useState<UnifiedFeedFilters>(() => {
    // Initialize from URL params or localStorage
    const urlFilters = getFiltersFromURL();
    if (Object.keys(urlFilters).length > 0) {
      return urlFilters;
    }
    
    // Try localStorage
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    
    return {};
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.timeframe) params.set('timeframe', filters.timeframe);
    if (filters.clientId) params.set('clientId', filters.clientId.toString());
    if (filters.prospectId) params.set('prospectId', filters.prospectId.toString());
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);

    // Update URL hash (for HashRouter) or search params (for BrowserRouter)
    const hash = window.location.hash;
    const baseHash = hash.split('?')[0];
    const newHash = params.toString() ? `${baseHash}?${params.toString()}` : baseHash;
    
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [filters]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);

  // Sync from URL changes (e.g., browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const urlFilters = getFiltersFromURL();
      setFilters(urlFilters);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const updateFilters = useCallback((newFilters: UnifiedFeedFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    localStorage.removeItem(FILTER_STORAGE_KEY);
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}

function getFiltersFromURL(): UnifiedFeedFilters {
  const filters: UnifiedFeedFilters = {};
  
  // Get params from URL hash or search
  const hash = window.location.hash;
  const search = window.location.search;
  const queryString = hash.includes('?') ? hash.split('?')[1] : search.substring(1);
  const params = new URLSearchParams(queryString);

  const timeframe = params.get('timeframe');
  if (timeframe && ['now', 'next', 'scheduled', 'all'].includes(timeframe)) {
    filters.timeframe = timeframe as any;
  }

  const clientId = params.get('clientId');
  if (clientId) {
    const id = Number(clientId);
    if (!isNaN(id)) filters.clientId = id;
  }

  const prospectId = params.get('prospectId');
  if (prospectId) {
    const id = Number(prospectId);
    if (!isNaN(id)) filters.prospectId = id;
  }

  const type = params.get('type');
  if (type && ['task', 'alert', 'appointment', 'all'].includes(type)) {
    filters.type = type as any;
  }

  const status = params.get('status');
  if (status && ['pending', 'completed', 'dismissed', 'all'].includes(status)) {
    filters.status = status as any;
  }

  return filters;
}

