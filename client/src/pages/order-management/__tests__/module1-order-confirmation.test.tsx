/**
 * Module 1: Order Confirmation & Receipts - Comprehensive Test Suite
 * 
 * Test Coverage:
 * - 1.1 Order Confirmation Page
 * - 1.2 PDF Receipt Generation (UI tests)
 * - 1.3 Email Notifications (UI tests)
 * - 1.4 Order Timeline/Tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderConfirmationPage from '../components/order-confirmation/order-confirmation-page';
import OrderSummary from '../components/order-confirmation/order-summary';
import OrderTimeline from '../components/order-confirmation/order-timeline';
import ReceiptActions from '../components/order-confirmation/receipt-actions';
import { Order } from '../types/order.types';

// Mock API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockOrder: Order = {
  id: 12345,
  modelOrderId: 'ORD-2024-001',
  clientId: 1,
  status: 'Pending',
  submittedAt: '2024-12-15T10:30:00Z',
  authorizedAt: null,
  rejectedAt: null,
  rejectedReason: null,
  authorizedBy: null,
  orderFormData: {
    cartItems: [
      {
        id: '1',
        productId: 1,
        schemeName: 'Test Mutual Fund Scheme',
        transactionType: 'Purchase',
        amount: 10000,
        units: null,
        orderType: 'Lump Sum',
      },
    ],
    transactionMode: {
      mode: 'Email',
      email: 'test@example.com',
    },
    nominees: [],
    optOutOfNomination: true,
    fullSwitchData: null,
    fullRedemptionData: null,
  },
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Module 1.1: Order Confirmation Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TC-M1-1.1-001: Order Confirmation Page Display After Submission', () => {
    it('should display order confirmation page with correct order ID', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('confirmation')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockOrder }),
          } as Response);
        }
        if (url.includes('timeline')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      renderWithQueryClient(<OrderConfirmationPage orderId={12345} />);

      await waitFor(() => {
        expect(screen.getByText('Order Confirmation')).toBeInTheDocument();
      });

      expect(screen.getByText('Your order has been submitted successfully')).toBeInTheDocument();
    });

    it('should display success banner with order ID', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('confirmation')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockOrder }),
          } as Response);
        }
        if (url.includes('timeline')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      renderWithQueryClient(<OrderConfirmationPage orderId={12345} />);

      await waitFor(() => {
        // The text might be split across elements, so use a more flexible matcher
        expect(screen.getByText(/Order Submitted Successfully/i, { exact: false })).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check for order ID separately - it may appear multiple times, so use getAllByText
      await waitFor(() => {
        const orderIdElements = screen.getAllByText(mockOrder.modelOrderId);
        expect(orderIdElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TC-M1-1.1-002: Order Confirmation Page Header and Navigation', () => {
    it('should display header and back button', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('confirmation')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockOrder }),
          } as Response);
        }
        if (url.includes('timeline')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      const onBack = vi.fn();
      renderWithQueryClient(<OrderConfirmationPage orderId={12345} onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByText('Order Confirmation')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Orders');
      expect(backButton).toBeInTheDocument();

      fireEvent.click(backButton);
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('TC-M1-1.1-005: Loading State Display', () => {
    it('should show loading skeleton while fetching order data', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithQueryClient(<OrderConfirmationPage orderId={12345} />);

      // Check for skeleton loaders - look for the Skeleton component
      await waitFor(() => {
        const skeleton = document.querySelector('[class*="animate-pulse"]') || 
                        document.querySelector('[class*="skeleton"]') ||
                        document.querySelector('[class*="Skeleton"]');
        expect(skeleton).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('TC-M1-1.1-006: Error Handling - Order Not Found', () => {
    it('should display error message when order is not found', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('confirmation')) {
          return Promise.reject(new Error('Order not found'));
        }
        if (url.includes('timeline')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          } as Response);
        }
        return Promise.reject(new Error('Order not found'));
      });

      renderWithQueryClient(<OrderConfirmationPage orderId={99999} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load order confirmation/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Module 1.1: Order Summary Component', () => {
  describe('TC-M1-1.1-003: Order Summary Display', () => {
    it('should display all order items with correct details', () => {
      render(<OrderSummary order={mockOrder} />);

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Test Mutual Fund Scheme')).toBeInTheDocument();
      expect(screen.getByText('Purchase')).toBeInTheDocument();
    });

    it('should calculate and display total amount correctly', () => {
      const orderWithMultipleItems: Order = {
        ...mockOrder,
        orderFormData: {
          ...mockOrder.orderFormData,
          cartItems: [
            { ...mockOrder.orderFormData.cartItems[0], amount: 5000 },
            { ...mockOrder.orderFormData.cartItems[0], id: '2', amount: 3000 },
          ],
        },
      };

      render(<OrderSummary order={orderWithMultipleItems} />);

      // Total should be 8000 (5000 + 3000)
      expect(screen.getByText(/₹8,000/i)).toBeInTheDocument();
    });
  });
});

describe('Module 1.2: PDF Receipt Generation', () => {
  describe('TC-M1-1.2-001: PDF Receipt Download - Successful Generation', () => {
    it('should show loading state when generating PDF', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('generate-receipt')) {
          return Promise.resolve({
            ok: true,
            blob: async () => new Blob(['PDF content'], { type: 'application/pdf' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      // Mock window.URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      renderWithQueryClient(<ReceiptActions orderId={12345} order={mockOrder} />);

      const downloadButton = screen.getByText(/Download Receipt/i);
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Generating/i)).toBeInTheDocument();
      });
    });
  });

  describe('TC-M1-1.2-004: PDF Receipt Error Handling - API Failure', () => {
    it('should display error message when PDF generation fails', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const { toast } = await import('@/hooks/use-toast');

      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('generate-receipt')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Failed to generate receipt' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      renderWithQueryClient(<ReceiptActions orderId={12345} order={mockOrder} />);

      const downloadButton = screen.getByText(/Download Receipt/i);
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });
  });
});

describe('Module 1.3: Email Notifications', () => {
  describe('TC-M1-1.3-001: Email Confirmation - Manual Send', () => {
    it('should show loading state when sending email', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('send-email')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockOrder }),
        } as Response);
      });

      renderWithQueryClient(<ReceiptActions orderId={12345} order={mockOrder} />);

      const sendEmailButton = screen.getByText(/Send Email Confirmation/i);
      fireEvent.click(sendEmailButton);

      await waitFor(() => {
        expect(screen.getByText(/Sending/i)).toBeInTheDocument();
      });
    });
  });

  describe('TC-M1-1.3-004: Email Confirmation - Error Handling - No Email Address', () => {
    it('should handle error when email address is not available', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      const { toast } = await import('@/hooks/use-toast');

      const orderWithoutEmail: Order = {
        ...mockOrder,
        orderFormData: {
          ...mockOrder.orderFormData,
          transactionMode: {
            mode: 'Physical',
          },
        },
      };

      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('send-email')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Email address not found' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: orderWithoutEmail }),
        } as Response);
      });

      renderWithQueryClient(<ReceiptActions orderId={12345} order={orderWithoutEmail} />);

      const sendEmailButton = screen.getByText(/Send Email Confirmation/i);
      fireEvent.click(sendEmailButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('TC-M1-1.3-008: Email Confirmation - Email Address Display', () => {
    it('should display email address when available', () => {
      render(<ReceiptActions orderId={12345} order={mockOrder} />);

      expect(screen.getByText(/Email will be sent to: test@example.com/i)).toBeInTheDocument();
    });
  });
});

describe('Module 1.4: Order Timeline/Tracking', () => {
  const mockTimelineEvents = [
    {
      id: 'submitted',
      status: 'Submitted',
      timestamp: '2024-12-15T10:30:00Z',
      description: 'Order was submitted successfully',
    },
    {
      id: 'authorized',
      status: 'Authorized',
      timestamp: '2024-12-15T11:00:00Z',
      description: 'Order was authorized',
    },
  ];

  describe('TC-M1-1.4-001: Order Timeline Display', () => {
    it('should display timeline events chronologically', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockTimelineEvents }),
      } as Response);

      renderWithQueryClient(<OrderTimeline orderId={12345} />);

      await waitFor(() => {
        expect(screen.getByText('Order Timeline')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Authorized')).toBeInTheDocument();
      });
    });
  });

  describe('TC-M1-1.4-002: Order Timeline Events - Submitted', () => {
    it('should display submitted event with correct details', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockTimelineEvents[0]] }),
      } as Response);

      renderWithQueryClient(<OrderTimeline orderId={12345} />);

      await waitFor(() => {
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Order was submitted successfully')).toBeInTheDocument();
      });
    });
  });

  describe('TC-M1-1.4-006: Order Timeline - Empty State', () => {
    it('should display empty state when no timeline events', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      renderWithQueryClient(<OrderTimeline orderId={12345} />);

      await waitFor(() => {
        expect(screen.getByText(/No timeline events available/i)).toBeInTheDocument();
      });
    });
  });

  describe('TC-M1-1.4-007: Order Timeline - Loading State', () => {
    it('should show loading skeleton while fetching timeline', async () => {
      const { apiRequest } = await import('@/lib/queryClient');
      vi.mocked(apiRequest).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithQueryClient(<OrderTimeline orderId={12345} />);

      await waitFor(() => {
        expect(screen.getByText('Order Timeline')).toBeInTheDocument();
        // Skeleton should be displayed during loading - look for animate-pulse class
        const skeleton = document.querySelector('[class*="animate-pulse"]') || 
                        document.querySelector('[class*="skeleton"]') ||
                        document.querySelector('[class*="Skeleton"]');
        expect(skeleton).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});

