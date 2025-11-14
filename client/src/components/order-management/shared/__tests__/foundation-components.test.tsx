/**
 * Foundation Layer - F4: Design System Components Tests
 * Comprehensive test suite for shared React components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AmountInput,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  OrderCard,
} from '../index';
import type { CartItem } from '@shared/types/order-management.types';
import { ShoppingCart } from 'lucide-react';

describe('Foundation Layer - F4: Design System Components', () => {
  describe('AmountInput', () => {
    it('should render amount input', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/amount/i);
      expect(input).toBeInTheDocument();
    });

    it('should display label', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} label="Investment Amount" />);
      
      expect(screen.getByText(/investment amount/i)).toBeInTheDocument();
    });

    it('should call onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/amount/i);
      fireEvent.change(input, { target: { value: '10000' } });
      
      expect(handleChange).toHaveBeenCalledWith(10000);
    });

    it('should validate positive amount', () => {
      const handleChange = vi.fn();
      const handleValidationChange = vi.fn();
      render(
        <AmountInput
          value={0}
          onChange={handleChange}
          onValidationChange={handleValidationChange}
        />
      );
      
      const input = screen.getByLabelText(/amount/i);
      fireEvent.change(input, { target: { value: '-100' } });
      
      expect(handleValidationChange).toHaveBeenCalledWith(false);
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
    });

    it('should validate amount range', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} min={1000} max={100000} />);
      
      const input = screen.getByLabelText(/amount/i);
      fireEvent.change(input, { target: { value: '500' } });
      
      expect(screen.getByText(/at least/i)).toBeInTheDocument();
    });

    it('should display presets when enabled', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} showPresets />);
      
      expect(screen.getByText(/₹5,000/i)).toBeInTheDocument();
      expect(screen.getByText(/₹10,000/i)).toBeInTheDocument();
    });

    it('should set value when preset is clicked', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} showPresets />);
      
      const preset = screen.getByText(/₹5,000/i);
      fireEvent.click(preset);
      
      expect(handleChange).toHaveBeenCalledWith(5000);
    });

    it('should display error message', () => {
      const handleChange = vi.fn();
      render(<AmountInput value={0} onChange={handleChange} error="Custom error" />);
      
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('should render empty state', () => {
      render(
        <EmptyState
          title="No items"
          description="Your cart is empty"
        />
      );
      
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <EmptyState
          icon={ShoppingCart}
          title="Empty Cart"
          description="Add items to continue"
        />
      );
      
      expect(screen.getByText('Empty Cart')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No items"
          description="Your cart is empty"
          action={{
            label: 'Browse Products',
            onClick: handleAction,
          }}
        />
      );
      
      const button = screen.getByText('Browse Products');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('ErrorState', () => {
    it('should render error state', () => {
      render(<ErrorState message="Something went wrong" />);
      
      // Message appears in both title (default) and description
      const messages = screen.getAllByText('Something went wrong');
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it('should render custom title', () => {
      render(
        <ErrorState
          title="Custom Error Title"
          message="Error details"
        />
      );
      
      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('should render retry button when provided', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          message="Error occurred"
          onRetry={handleRetry}
        />
      );
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalled();
    });

    it('should support different variants', () => {
      const { rerender } = render(
        <ErrorState message="Error" variant="default" />
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      rerender(<ErrorState message="Error" variant="destructive" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      rerender(<ErrorState message="Error" variant="warning" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('LoadingSkeleton', () => {
    it('should render card variant', () => {
      const { container } = render(<LoadingSkeleton variant="card" count={3} />);
      
      // Check for Skeleton component elements (they have animate-pulse class)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render list variant', () => {
      const { container } = render(<LoadingSkeleton variant="list" count={2} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render table variant', () => {
      const { container } = render(<LoadingSkeleton variant="table" count={5} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render form variant', () => {
      const { container } = render(<LoadingSkeleton variant="form" count={4} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render default count when not specified', () => {
      const { container } = render(<LoadingSkeleton variant="card" />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('OrderCard', () => {
    const mockCartItem: CartItem = {
      id: 'item-1',
      productId: 1,
      schemeName: 'Test Mutual Fund',
      transactionType: 'Purchase',
      amount: 10000,
      units: 200,
      nav: 50,
      orderType: 'Initial Purchase',
    };

    it('should render order card', () => {
      render(<OrderCard item={mockCartItem} />);
      
      expect(screen.getByText('Test Mutual Fund')).toBeInTheDocument();
      expect(screen.getByText(/₹10,000/i)).toBeInTheDocument();
    });

    it('should display transaction type badge', () => {
      render(<OrderCard item={mockCartItem} />);
      
      expect(screen.getByText('Purchase')).toBeInTheDocument();
    });

    it('should display order type badge when present', () => {
      render(<OrderCard item={mockCartItem} />);
      
      expect(screen.getByText('Initial Purchase')).toBeInTheDocument();
    });

    it('should display units and NAV when available', () => {
      render(<OrderCard item={mockCartItem} />);
      
      expect(screen.getByText(/200.0000/i)).toBeInTheDocument();
      expect(screen.getByText(/₹50.00/i)).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const handleEdit = vi.fn();
      render(<OrderCard item={mockCartItem} onEdit={handleEdit} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(handleEdit).toHaveBeenCalledWith('item-1');
    });

    it('should call onRemove when remove button is clicked', () => {
      const handleRemove = vi.fn();
      const { container } = render(<OrderCard item={mockCartItem} onRemove={handleRemove} />);
      
      // Find button with Trash2 icon by finding all buttons and checking which one has the icon
      const buttons = container.querySelectorAll('button');
      const removeButton = Array.from(buttons).find(btn => 
        btn.querySelector('svg') && btn.className.includes('text-destructive')
      );
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton!);
      
      expect(handleRemove).toHaveBeenCalledWith('item-1');
    });

    it('should call onView when view button is clicked', () => {
      const handleView = vi.fn();
      render(<OrderCard item={mockCartItem} onView={handleView} />);
      
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
      
      expect(handleView).toHaveBeenCalledWith('item-1');
    });

    it('should hide actions when showActions is false', () => {
      render(<OrderCard item={mockCartItem} showActions={false} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });

    it('should display source scheme name for switch transactions', () => {
      const switchItem: CartItem = {
        ...mockCartItem,
        transactionType: 'Switch',
        sourceSchemeName: 'Source Scheme',
      };
      
      render(<OrderCard item={switchItem} />);
      
      expect(screen.getByText('Source Scheme')).toBeInTheDocument();
    });
  });
});

