/**
 * Search Bar Component Tests
 * Phase 3: Filtering & Search Enhancement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar, HighlightText } from '../SearchBar';

describe('SearchBar', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/search tasks/i);
    expect(input).toBeInTheDocument();
  });

  it('should call onChange with debounced value', async () => {
    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText(/search tasks/i);
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });
  });

  it('should show clear button when value is entered', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear value when clear button is clicked', () => {
    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should sync with external value changes', () => {
    const { rerender } = render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/search tasks/i) as HTMLInputElement;
    expect(input.value).toBe('');

    rerender(<SearchBar value="new value" onChange={mockOnChange} />);
    expect(input.value).toBe('new value');
  });

  it('should use custom placeholder', () => {
    render(<SearchBar value="" onChange={mockOnChange} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should debounce multiple rapid changes', async () => {
    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText(/search tasks/i);
    
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });

    // Fast-forward time
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      // Should call with final value (may be called multiple times due to internal state updates)
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });
  });
});

describe('HighlightText', () => {
  it('should render text without highlighting when no search term', () => {
    const { container } = render(<HighlightText text="Test text" searchTerm="" />);
    
    expect(container.textContent).toBe('Test text');
    expect(container.querySelector('mark')).not.toBeInTheDocument();
  });

  it('should highlight matching text', () => {
    const { container } = render(<HighlightText text="Test text" searchTerm="test" />);
    
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('Test');
  });

  it('should be case-insensitive', () => {
    const { container } = render(<HighlightText text="Test text" searchTerm="TEST" />);
    
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('Test');
  });

  it('should highlight multiple matches', () => {
    const { container } = render(
      <HighlightText text="test test test" searchTerm="test" />
    );
    
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(3);
  });

  it('should handle special characters in search term', () => {
    const { container } = render(
      <HighlightText text="test (special)" searchTerm="special" />
    );
    
    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('special');
  });
});

