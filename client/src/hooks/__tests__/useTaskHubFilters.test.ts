/**
 * useTaskHubFilters Hook Tests
 * Phase 3: Filtering & Search Enhancement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskHubFilters } from '../useTaskHubFilters';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  hash: '',
  search: '',
  pathname: '/task-hub',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('useTaskHubFilters', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockLocation.hash = '';
    mockLocation.search = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters).toEqual({});
  });

  it('should load filters from localStorage', () => {
    const storedFilters = { status: 'pending', type: 'task' };
    localStorageMock.setItem('task-hub-filters', JSON.stringify(storedFilters));

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters).toEqual(storedFilters);
  });

  it('should load filters from URL hash', () => {
    mockLocation.hash = '#/task-hub?status=pending&type=task';

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters).toEqual({
      status: 'pending',
      type: 'task',
    });
  });

  it('should prioritize URL filters over localStorage', () => {
    localStorageMock.setItem('task-hub-filters', JSON.stringify({ status: 'completed' }));
    mockLocation.hash = '#/task-hub?status=pending';

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters).toEqual({ status: 'pending' });
  });

  it('should update filters', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    act(() => {
      result.current.updateFilters({ status: 'pending' });
    });

    expect(result.current.filters).toEqual({ status: 'pending' });
  });

  it('should persist filters to localStorage', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    act(() => {
      result.current.updateFilters({ status: 'pending', type: 'task' });
    });

    const stored = localStorageMock.getItem('task-hub-filters');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual({ status: 'pending', type: 'task' });
  });

  it('should sync filters to URL', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    act(() => {
      result.current.updateFilters({ status: 'pending', type: 'task' });
    });

    // URL should be updated (checking via hash change)
    expect(mockLocation.hash).toContain('status=pending');
    expect(mockLocation.hash).toContain('type=task');
  });

  it('should clear filters', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    act(() => {
      result.current.updateFilters({ status: 'pending' });
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(localStorageMock.getItem('task-hub-filters')).toBeNull();
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.setItem('task-hub-filters', 'invalid json');

    const { result } = renderHook(() => useTaskHubFilters());

    // Should not throw and should default to empty filters
    expect(result.current.filters).toEqual({});
  });

  it('should parse clientId from URL', () => {
    mockLocation.hash = '#/task-hub?clientId=123';

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters.clientId).toBe(123);
  });

  it('should parse prospectId from URL', () => {
    mockLocation.hash = '#/task-hub?prospectId=456';

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters.prospectId).toBe(456);
  });

  it('should ignore invalid filter values from URL', () => {
    mockLocation.hash = '#/task-hub?status=invalid&type=invalid';

    const { result } = renderHook(() => useTaskHubFilters());

    expect(result.current.filters).toEqual({});
  });

  it('should handle hash change events', () => {
    const { result } = renderHook(() => useTaskHubFilters());

    act(() => {
      mockLocation.hash = '#/task-hub?status=pending';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current.filters.status).toBe('pending');
  });
});

