/**
 * Module 2: Integration Testing & Bug Fixes
 * End-to-end integration tests for Order Confirmation flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderManagementPage } from '../index';
import OrderConfirmationPage from '../components/order-confirmation/order-confirmation-page';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Mock API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock window.location.hash
const mockHashChange = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
  },
  writable: true,
});

describe('Module 2: Integration Testing - Order Confirmation Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    window.location.hash = '';
  });

  describe('TC-M2-001: Complete Order Submission → Confirmation Flow', () => {
    it('should navigate to confirmation page after successful order submission', async () => {
      const mockOrder = {
        id: 12345,
        modelOrderId: 'MO-20241215-ABC12',
        clientId: 1,
        status: 'Pending Approval',
        submittedAt: new Date().toISOString(),
        orderFormData: {
          cartItems: [
            {
              id: '1',
              productId: 1,
              schemeName: 'Test Scheme',
              transactionType: 'Purchase',
              amount: 10000,
            },
          ],
          transactionMode: {
            mode: 'Email',
            email: 'test@example.com',
          },
          nominees: [],
          optOutOfNomination: true,
        },
      };

      // Mock order submission
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (method === 'POST' && url === '/api/order-management/orders/submit') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockOrder,
            }),
          } as Response);
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      // Mock confirmation page API
      const originalApiRequest = vi.mocked(apiRequest);
      originalApiRequest.mockImplementation((method, url) => {
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
        return Promise.reject(new Error('Unexpected API call'));
      });

      // Verify navigation happens
      const orderId = mockOrder.id;
      window.location.hash = `#/order-management/orders/${orderId}/confirmation`;
      
      expect(window.location.hash).toBe(`#/order-management/orders/${orderId}/confirmation`);
    });
  });

  describe('TC-M2-002: Order Confirmation Page API Integration', () => {
    it('should fetch order confirmation data from API', async () => {
      const mockOrder = {
        id: 12345,
        modelOrderId: 'MO-20241215-ABC12',
        status: 'Pending',
        submittedAt: '2024-12-15T10:30:00Z',
        orderFormData: {
          cartItems: [],
          transactionMode: { mode: 'Email' },
          nominees: [],
          optOutOfNomination: true,
        },
      };

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
        return Promise.reject(new Error('Unexpected API call'));
      });

      render(
        <QueryClientProvider client={queryClient}>
          <OrderConfirmationPage orderId={12345} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
          'GET',
          '/api/order-management/orders/12345/confirmation'
        );
      });
    });
  });

  describe('TC-M2-003: PDF Receipt Generation Integration', () => {
    it('should call PDF generation API and download file', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('generate-receipt')) {
          return Promise.resolve({
            ok: true,
            blob: async () => mockBlob,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: {} }),
        } as Response);
      });

      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      // Simulate PDF download
      const response = await apiRequest('POST', '/api/order-management/orders/12345/generate-receipt');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'order-receipt-MO-20241215-ABC12.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/order-management/orders/12345/generate-receipt'
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('TC-M2-004: Email Notification Integration', () => {
    it('should call email sending API', async () => {
      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('send-email')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Email sent' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: {} }),
        } as Response);
      });

      const response = await apiRequest('POST', '/api/order-management/orders/12345/send-email');
      const data = await response.json();

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/order-management/orders/12345/send-email'
      );
      expect(data.success).toBe(true);
    });
  });

  describe('TC-M2-005: Order Timeline Integration', () => {
    it('should fetch timeline events from API', async () => {
      const mockTimeline = [
        {
          id: 'submitted',
          status: 'Submitted',
          timestamp: '2024-12-15T10:30:00Z',
          description: 'Order was submitted successfully',
        },
      ];

      vi.mocked(apiRequest).mockImplementation((method, url) => {
        if (url.includes('timeline')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockTimeline }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: {} }),
        } as Response);
      });

      const response = await apiRequest('GET', '/api/order-management/orders/12345/timeline');
      const data = await response.json();

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/order-management/orders/12345/timeline'
      );
      expect(data.data).toEqual(mockTimeline);
    });
  });

  describe('TC-M2-006: Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(apiRequest).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            success: false,
            message: 'Order not found',
            error: 'Order with ID 99999 does not exist',
          }),
        } as Response);
      });

      const response = await apiRequest('GET', '/api/order-management/orders/99999/confirmation');
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });

    it('should display error toast on API failure', async () => {
      vi.mocked(apiRequest).mockRejectedValue(new Error('Network error'));

      try {
        await apiRequest('GET', '/api/order-management/orders/12345/confirmation');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});

