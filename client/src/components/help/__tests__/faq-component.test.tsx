/**
 * Module 6: Onboarding & Guidance - FAQ Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FAQComponent } from '../faq-component';
import { FAQItem } from '../faq-component';

const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add a new client?',
    answer: 'Navigate to the Clients page and click Add Client.',
    category: 'Clients',
    tags: ['clients', 'add'],
  },
  {
    id: '2',
    question: 'How do I place an order?',
    answer: 'Go to Order Management and add products to cart.',
    category: 'Orders',
    tags: ['orders'],
  },
];

describe('Module 6: FAQ Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render FAQ component with default FAQs', () => {
    render(<FAQComponent />);

    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    expect(screen.getByText(/find answers/i)).toBeInTheDocument();
  });

  it('should display all FAQs', () => {
    render(<FAQComponent faqs={mockFAQs} />);

    expect(screen.getByText('How do I add a new client?')).toBeInTheDocument();
    expect(screen.getByText('How do I place an order?')).toBeInTheDocument();
  });

  it('should filter FAQs by search query', async () => {
    render(<FAQComponent faqs={mockFAQs} />);

    const searchInput = screen.getByPlaceholderText(/search faqs/i);
    fireEvent.change(searchInput, { target: { value: 'client' } });

    await waitFor(() => {
      expect(screen.getByText('How do I add a new client?')).toBeInTheDocument();
      expect(screen.queryByText('How do I place an order?')).not.toBeInTheDocument();
    });
  });

  it('should filter FAQs by category', async () => {
    render(<FAQComponent faqs={mockFAQs} />);

    const clientsBadge = screen.getByText('Clients');
    fireEvent.click(clientsBadge);

    await waitFor(() => {
      expect(screen.getByText('How do I add a new client?')).toBeInTheDocument();
      expect(screen.queryByText('How do I place an order?')).not.toBeInTheDocument();
    });
  });

  it('should expand FAQ item when clicked', async () => {
    render(<FAQComponent faqs={mockFAQs} />);

    const question = screen.getByText('How do I add a new client?');
    fireEvent.click(question);

    await waitFor(() => {
      expect(screen.getByText('Navigate to the Clients page and click Add Client.')).toBeInTheDocument();
    });
  });

  it('should show empty state when no FAQs match search', async () => {
    render(<FAQComponent faqs={mockFAQs} />);

    const searchInput = screen.getByPlaceholderText(/search faqs/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no faqs found/i)).toBeInTheDocument();
    });
  });

  it('should display tags for FAQs', () => {
    render(<FAQComponent faqs={mockFAQs} />);

    const question = screen.getByText('How do I add a new client?');
    fireEvent.click(question);

    expect(screen.getByText('clients')).toBeInTheDocument();
    expect(screen.getByText('add')).toBeInTheDocument();
  });
});

