/**
 * Module 7: Frontend-Backend Integration Enhancement
 * 7.3 Data Synchronization
 * 
 * Data synchronization service with optimistic updates,
 * conflict resolution, and sync status tracking
 */

import React from 'react';
import { queryClient } from './queryClient';
import { apiCache } from './api-cache';
import { APIError } from '@shared/utils/errors';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  conflicts: Conflict[];
}

export interface Conflict {
  key: string;
  localValue: any;
  serverValue: any;
  timestamp: number;
}

export interface OptimisticUpdate<TData = any> {
  queryKey: string[];
  optimisticData: TData;
  rollbackData?: TData;
}

class DataSyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    conflicts: [],
  };
  
  private optimisticUpdates: Map<string, OptimisticUpdate> = new Map();
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify listeners of status changes
   */
  private notifyListeners(): void {
    this.syncListeners.forEach(listener => listener(this.syncStatus));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Apply optimistic update
   */
  applyOptimisticUpdate<TData = any>(update: OptimisticUpdate<TData>): void {
    const key = update.queryKey.join(':');
    
    // Store current data for rollback
    const currentData = queryClient.getQueryData<TData>(update.queryKey);
    
    // Apply optimistic update
    queryClient.setQueryData(update.queryKey, update.optimisticData);
    
    // Store update for potential rollback
    this.optimisticUpdates.set(key, {
      ...update,
      rollbackData: currentData || update.rollbackData,
    });
    
    this.syncStatus.pendingChanges++;
    this.notifyListeners();
  }

  /**
   * Confirm optimistic update (server confirmed)
   */
  confirmOptimisticUpdate(queryKey: string[]): void {
    const key = queryKey.join(':');
    this.optimisticUpdates.delete(key);
    
    this.syncStatus.pendingChanges = Math.max(0, this.syncStatus.pendingChanges - 1);
    this.notifyListeners();
  }

  /**
   * Rollback optimistic update (server rejected)
   */
  rollbackOptimisticUpdate(queryKey: string[]): void {
    const key = queryKey.join(':');
    const update = this.optimisticUpdates.get(key);
    
    if (update && update.rollbackData !== undefined) {
      queryClient.setQueryData(queryKey, update.rollbackData);
      this.optimisticUpdates.delete(key);
      
      this.syncStatus.pendingChanges = Math.max(0, this.syncStatus.pendingChanges - 1);
      this.notifyListeners();
    }
  }

  /**
   * Rollback all optimistic updates
   */
  rollbackAllOptimisticUpdates(): void {
    this.optimisticUpdates.forEach((update, key) => {
      if (update.rollbackData !== undefined) {
        queryClient.setQueryData(update.queryKey, update.rollbackData);
      }
    });
    
    this.optimisticUpdates.clear();
    this.syncStatus.pendingChanges = 0;
    this.notifyListeners();
  }

  /**
   * Invalidate and refetch queries
   */
  async syncQueries(queryKeys: string[][]): Promise<void> {
    this.syncStatus.isSyncing = true;
    this.notifyListeners();
    
    try {
      await Promise.all(
        queryKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
      );
      
      this.syncStatus.lastSyncTime = Date.now();
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      return;
    }
    
    this.syncStatus.isSyncing = true;
    this.notifyListeners();
    
    try {
      // Invalidate all queries to force refetch
      await queryClient.invalidateQueries();
      
      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.pendingChanges = 0;
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Detect conflicts between local and server data
   */
  detectConflict(
    key: string,
    localValue: any,
    serverValue: any
  ): boolean {
    if (JSON.stringify(localValue) === JSON.stringify(serverValue)) {
      return false;
    }
    
    const conflict: Conflict = {
      key,
      localValue,
      serverValue,
      timestamp: Date.now(),
    };
    
    // Remove existing conflict for this key
    this.syncStatus.conflicts = this.syncStatus.conflicts.filter(c => c.key !== key);
    
    // Add new conflict
    this.syncStatus.conflicts.push(conflict);
    this.notifyListeners();
    
    return true;
  }

  /**
   * Resolve conflict by accepting server value
   */
  resolveConflict(key: string, acceptServer: boolean = true): void {
    const conflict = this.syncStatus.conflicts.find(c => c.key === key);
    if (!conflict) {
      return;
    }
    
    if (acceptServer) {
      // Accept server value - invalidate query to refetch
      const queryKey = key.split(':');
      queryClient.invalidateQueries({ queryKey });
    } else {
      // Keep local value - no action needed
    }
    
    // Remove conflict
    this.syncStatus.conflicts = this.syncStatus.conflicts.filter(c => c.key !== key);
    this.notifyListeners();
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.syncStatus.conflicts = [];
    this.notifyListeners();
  }

  /**
   * Invalidate cache for specific query
   */
  invalidateCache(queryKey: string[]): void {
    queryClient.invalidateQueries({ queryKey });
    
    // Also clear API cache
    const url = queryKey[0] as string;
    if (url) {
      apiCache.delete(url);
    }
  }

  /**
   * Prefetch data for better UX
   */
  async prefetch<TData = any>(
    queryKey: string[],
    queryFn: () => Promise<TData>
  ): Promise<void> {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  }

  /**
   * Set query data directly (for immediate updates)
   */
  setQueryData<TData = any>(
    queryKey: string[],
    data: TData | ((old: TData | undefined) => TData)
  ): void {
    queryClient.setQueryData(queryKey, data);
  }

  /**
   * Get query data
   */
  getQueryData<TData = any>(queryKey: string[]): TData | undefined {
    return queryClient.getQueryData<TData>(queryKey);
  }
}

// Singleton instance
export const dataSync = new DataSyncService();

/**
 * Hook for data synchronization
 */
export function useDataSync() {
  const [status, setStatus] = React.useState<SyncStatus>(dataSync.getStatus());
  
  React.useEffect(() => {
    const unsubscribe = dataSync.subscribe(setStatus);
    return unsubscribe;
  }, []);
  
  return {
    ...status,
    syncAll: () => dataSync.syncAll(),
    syncQueries: (keys: string[][]) => dataSync.syncQueries(keys),
    invalidateCache: (key: string[]) => dataSync.invalidateCache(key),
    resolveConflict: (key: string, acceptServer?: boolean) => dataSync.resolveConflict(key, acceptServer),
    clearConflicts: () => dataSync.clearConflicts(),
  };
}

