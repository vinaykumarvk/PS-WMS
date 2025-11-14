/**
 * Unit tests for SIP Builder Wizard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SIPBuilderWizard from '../components/sip/sip-builder-wizard';
import { Product } from '../types/order.types';

const mockProducts: Product[] = [
  {
    id: 1,
    schemeName: 'Test Equity Fund',
    schemeCode: 'TEF001',
    category: 'Equity',
    nav: 100.5,
    minInvestment: 5000,
    maxInvestment: 1000000,
    rta: 'CAMS',
    riskLevel: 'High',
    isWhitelisted: true,
  },
  {
    id: 2,
    schemeName: 'Test Debt Fund',
    schemeCode: 'TDF001',
    category: 'Debt',
    nav: 50.25,
    minInvestment: 1000,
    rta: 'KFintech',
    riskLevel: 'Low',
    isWhitelisted: true,
  },
];

describe('SIPBuilderWizard', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wizard with first step', () => {
    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('SIP Builder')).toBeInTheDocument();
    expect(screen.getByText('Select Mutual Fund Scheme *')).toBeInTheDocument();
  });

  it('allows selecting a scheme', async () => {
    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const schemeSelect = screen.getByRole('combobox');
    fireEvent.click(schemeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Test Equity Fund')).toBeInTheDocument();
    });
  });

  it('validates required fields before proceeding', async () => {
    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select a scheme/i)).toBeInTheDocument();
    });
  });

  it('validates minimum amount', async () => {
    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select scheme
    const schemeSelect = screen.getByRole('combobox');
    fireEvent.click(schemeSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Equity Fund'));
    });

    // Enter invalid amount
    const amountInput = screen.getByLabelText(/SIP Amount/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at least ₹1,000/i)).toBeInTheDocument();
    });
  });

  it('allows navigation through steps', async () => {
    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Step 1: Select scheme
    const schemeSelect = screen.getByRole('combobox');
    fireEvent.click(schemeSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Equity Fund'));
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Step 2: Enter amount
    await waitFor(() => {
      expect(screen.getByLabelText(/SIP Amount/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/SIP Amount/i);
    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(nextButton);

    // Step 3: Schedule
    await waitFor(() => {
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with correct data on final step', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    render(
      <SIPBuilderWizard
        products={mockProducts}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Complete all steps
    const schemeSelect = screen.getByRole('combobox');
    fireEvent.click(schemeSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Equity Fund'));
    });

    let nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      const amountInput = screen.getByLabelText(/SIP Amount/i);
      fireEvent.change(amountInput, { target: { value: '5000' } });
    });

    nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      const startDateInput = screen.getByLabelText(/Start Date/i);
      fireEvent.change(startDateInput, { target: { value: tomorrowStr } });
    });

    nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Final step - submit
    await waitFor(() => {
      const submitButton = screen.getByText('Create SIP Plan');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          schemeId: 1,
          amount: 5000,
          startDate: tomorrowStr,
        })
      );
    });
  });
});

