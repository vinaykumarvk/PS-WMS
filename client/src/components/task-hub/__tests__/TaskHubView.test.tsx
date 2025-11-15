/**
 * Task Hub View Component Tests
 * Phase 3: Filtering & Search Enhancement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskHubView } from '../TaskHubView';

// Mock the hooks
vi.mock('@/hooks/useTaskHubFilters', () => ({
  useTaskHubFilters: () => ({
    filters: {},
    updateFilters: vi.fn(),
    clearFilters: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTaskHub', () => ({
  useTaskHub: () => ({
    items: [],
    nowItems: [],
    nextItems: [],
    scheduledItems: [],
    isLoading: false,
    error: null,
    completeTask: vi.fn(),
    dismissAlert: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({
      data: [],
      isLoading: false,
    }),
  };
});

describe('TaskHubView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render task hub header', () => {
    renderWithProviders(<TaskHubView />);

    expect(screen.getByText('Task Hub')).toBeInTheDocument();
    expect(screen.getByText(/unified view/i)).toBeInTheDocument();
  });

  it('should render search bar', () => {
    renderWithProviders(<TaskHubView />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render filter section', () => {
    renderWithProviders(<TaskHubView />);

    expect(screen.getByText('Search & Filters')).toBeInTheDocument();
  });

  it('should render timeline view', () => {
    renderWithProviders(<TaskHubView />);

    // TimelineView should be rendered (checking for column headers)
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('should show filter count when filters are active', () => {
    // Mock filters with active filters
    vi.mocked(require('@/hooks/useTaskHubFilters').useTaskHubFilters).mockReturnValue({
      filters: { status: 'pending', type: 'task' },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    renderWithProviders(<TaskHubView />);

    expect(screen.getByText(/clear all/i)).toBeInTheDocument();
  });

  it('should update search query', async () => {
    renderWithProviders(<TaskHubView />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    await waitFor(() => {
      expect(searchInput).toHaveValue('test query');
    });
  });
});

