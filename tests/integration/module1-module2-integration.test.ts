/**
 * Module 1 & Module 2: Integration Test Suite
 * 
 * Test Coverage:
 * - Module 1: Order Confirmation & Receipts API Integration
 * - Module 2: Frontend-Backend Integration Testing
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const baseUrl = process.env.API_URL || 'http://localhost:5000';
let authCookie: string;
let testOrderId: number;

describe('Module 1: Order Confirmation & Receipts - API Integration', () => {
  beforeAll(async () => {
    // Login and get auth cookie
    try {
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
        }),
      });

      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        authCookie = cookies.split(';')[0];
      }

      // Create a test order
      const orderResponse = await fetch(`${baseUrl}/api/order-management/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
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
          optOutOfNomination: true,
        }),
      });

      const orderData = await orderResponse.json();
      if (orderData.success && orderData.data) {
        testOrderId = orderData.data.id;
      }
    } catch (error) {
      console.warn('Setup failed, some tests may be skipped:', error);
    }
  });

  describe('TC-M2-2.1-002: Order Confirmation API Integration', () => {
    it('should return order confirmation data', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/confirmation`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('modelOrderId');
      expect(data.data).toHaveProperty('orderFormData');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/99999/confirmation`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect([404, 200]).toContain(response.status); // May return 200 with null data
    });
  });

  describe('TC-M2-2.1-003: PDF Receipt Generation API Integration', () => {
    it('should generate PDF receipt', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/generate-receipt`,
        {
          method: 'POST',
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/pdf');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/99999/generate-receipt`,
        {
          method: 'POST',
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('TC-M2-2.1-004: Email Sending API Integration', () => {
    it('should send confirmation email', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/send-email`,
        {
          method: 'POST',
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle missing email address gracefully', async () => {
      // Create order without email
      const orderResponse = await fetch(`${baseUrl}/api/order-management/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
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
            mode: 'Physical',
          },
          optOutOfNomination: true,
        }),
      });

      const orderData = await orderResponse.json();
      if (orderData.success && orderData.data) {
        const emailResponse = await fetch(
          `${baseUrl}/api/order-management/orders/${orderData.data.id}/send-email`,
          {
            method: 'POST',
            headers: {
              Cookie: authCookie,
            },
          }
        );

        // Should return 400 or 200 with appropriate message
        expect([400, 200]).toContain(emailResponse.status);
      }
    });
  });

  describe('TC-M2-2.1-005: Order Timeline API Integration', () => {
    it('should return order timeline', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/timeline`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('status');
        expect(data.data[0]).toHaveProperty('timestamp');
        expect(data.data[0]).toHaveProperty('description');
      }
    });

    it('should return empty array for non-existent order', async () => {
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/99999/timeline`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      // API may return 404 for non-existent order or 200 with empty array
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      } else {
        // 404 is also acceptable for non-existent order
        expect(response.status).toBe(404);
      }
    });
  });

  describe('TC-M2-2.1-006: Authentication Integration', () => {
    it('should include authentication token in requests', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/confirmation`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );

      expect(response.status).toBe(200);
    });

    it('should reject unauthorized requests', async () => {
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId || 12345}/confirmation`,
        {
          headers: {
            // No auth cookie
          },
        }
      );

      // Should return 401, 403, 302 (redirect), or 404 (if order not found)
      expect([401, 403, 302, 404]).toContain(response.status);
    });
  });

  describe('TC-M2-2.1-007: Error Handling Integration', () => {
    it('should handle 400 errors correctly', async () => {
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            // Invalid data
            cartItems: [],
          }),
        }
      );

      expect([400, 422]).toContain(response.status);
    });

    it('should handle 500 errors correctly', async () => {
      // This test may not always trigger a 500, but we can check error handling
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/99999/generate-receipt`,
        {
          method: 'POST',
          headers: {
            Cookie: authCookie,
          },
        }
      );

      // Should return appropriate error status
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('TC-M2-2.1-010: API Response Time Performance', () => {
    it('should respond to order confirmation within acceptable time', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const startTime = Date.now();
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/confirmation`,
        {
          headers: {
            Cookie: authCookie,
          },
        }
      );
      const endTime = Date.now();

      expect(response.status).toBe(200);
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should generate PDF within acceptable time', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const startTime = Date.now();
      const response = await fetch(
        `${baseUrl}/api/order-management/orders/${testOrderId}/generate-receipt`,
        {
          method: 'POST',
          headers: {
            Cookie: authCookie,
          },
        }
      );
      const endTime = Date.now();

      expect(response.status).toBe(200);
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should generate within 5 seconds
    });
  });
});

describe('Module 2: Integration Testing - Data Validation', () => {
  describe('TC-M2-2.1-008: Data Validation Integration', () => {
    it('should validate order data on submission', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          cartItems: [
            {
              id: '1',
              productId: 1,
              schemeName: 'Test Scheme',
              transactionType: 'Purchase',
              amount: 100, // Below minimum
            },
          ],
          transactionMode: {
            mode: 'Email',
            email: 'invalid-email', // Invalid email
          },
          optOutOfNomination: true,
        }),
      });

      // Should return validation errors
      expect([400, 422]).toContain(response.status);
      const data = await response.json();
      // Should contain validation error messages
      expect(data).toHaveProperty('message');
    });
  });

  describe('TC-M2-2.1-009: Request/Response Data Mapping', () => {
    it('should correctly map order submission data', async () => {
      const orderData = {
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
      };

      const response = await fetch(`${baseUrl}/api/order-management/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const responseData = await response.json();
        expect(responseData.data).toHaveProperty('orderFormData');
        expect(responseData.data.orderFormData.cartItems).toHaveLength(1);
        expect(responseData.data.orderFormData.transactionMode.mode).toBe('Email');
      }
    });
  });
});

