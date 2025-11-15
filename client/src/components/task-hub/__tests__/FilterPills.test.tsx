/**
 * Filter Pills Component Tests
 * Phase 3: Filtering & Search Enhancement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPills } from '../FilterPills';
import { UnifiedFeedFilters } from '@/hooks/useTaskHub';

describe('FilterPills', () => {
  const mockClients = [
    { id: 1, fullName: 'Client One' },
    { id: 2, fullName: 'Client Two' },
  ];

  const mockProspects = [
    { id: 1, fullName: 'Prospect One' },
    { id: 2, fullName: 'Prospect Two' },
  ];

  const mockFilters: UnifiedFeedFilters = {};
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filter sections', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        clients={mockClients}
        prospects={mockProspects}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Timeframe')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Prospect')).toBeInTheDocument();
  });

  it('should render status filter buttons', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />
    );

    // Check for status section specifically
    const statusSection = screen.getByText('Status').closest('div');
    expect(statusSection).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Dismissed')).toBeInTheDocument();
  });

  it('should render type filter buttons', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('Appointment')).toBeInTheDocument();
  });

  it('should call onFilterChange when status filter is clicked', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />
    );

    const pendingButton = screen.getByText('Pending');
    fireEvent.click(pendingButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('should call onFilterChange when type filter is clicked', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />
    );

    const taskButton = screen.getByText('Task');
    fireEvent.click(taskButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ type: 'task' });
  });

  it('should highlight active filters', () => {
    const filtersWithStatus: UnifiedFeedFilters = { status: 'pending' };
    
    render(
      <FilterPills
        filters={filtersWithStatus}
        onFilterChange={mockOnFilterChange}
      />
    );

    const pendingButton = screen.getByText('Pending');
    expect(pendingButton).toHaveClass('bg-primary'); // Active button styling
  });

  it('should show active filter count', () => {
    const filtersWithMultiple: UnifiedFeedFilters = {
      status: 'pending',
      type: 'task',
      timeframe: 'now'
    };

    render(
      <FilterPills
        filters={filtersWithMultiple}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText(/3 filter/)).toBeInTheDocument();
  });

  it('should show clear all button when filters are active', () => {
    const filtersWithStatus: UnifiedFeedFilters = { status: 'pending' };
    
    render(
      <FilterPills
        filters={filtersWithStatus}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('should call onFilterChange with empty object when clear all is clicked', () => {
    const filtersWithStatus: UnifiedFeedFilters = { status: 'pending' };
    
    render(
      <FilterPills
        filters={filtersWithStatus}
        onFilterChange={mockOnFilterChange}
      />
    );

    const clearButton = screen.getByText('Clear all');
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('should render client filter buttons', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        clients={mockClients}
      />
    );

    expect(screen.getByText('Client One')).toBeInTheDocument();
    expect(screen.getByText('Client Two')).toBeInTheDocument();
  });

  it('should call onFilterChange when client filter is clicked', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        clients={mockClients}
      />
    );

    const clientButton = screen.getByText('Client One');
    fireEvent.click(clientButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ clientId: 1 });
  });

  it('should remove client filter when clicked again', () => {
    const filtersWithClient: UnifiedFeedFilters = { clientId: 1 };
    
    render(
      <FilterPills
        filters={filtersWithClient}
        onFilterChange={mockOnFilterChange}
        clients={mockClients}
      />
    );

    const clientButton = screen.getByText('Client One');
    fireEvent.click(clientButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('should not show client section when no clients provided', () => {
    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.queryByText('Client')).not.toBeInTheDocument();
  });

  it('should limit client list to 10 items', () => {
    const manyClients = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      fullName: `Client ${i + 1}`
    }));

    render(
      <FilterPills
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        clients={manyClients}
      />
    );

    // Should only show first 10
    expect(screen.getByText('Client 1')).toBeInTheDocument();
    expect(screen.getByText('Client 10')).toBeInTheDocument();
    expect(screen.queryByText('Client 11')).not.toBeInTheDocument();
  });
});

