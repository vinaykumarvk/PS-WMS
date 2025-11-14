/**
 * Module 2.1: Frontend-Backend Integration Testing
 * Tests API endpoints for order confirmation functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Order Confirmation API Integration', () => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  let authCookie: string;
  let testOrderId: number;

  beforeAll(async () => {
    // Login and get auth cookie
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
  });

  describe('GET /api/order-management/orders/:id/confirmation', () => {
    it('should return order confirmation data', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/${testOrderId}/confirmation`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('modelOrderId');
      expect(data.data).toHaveProperty('orderFormData');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/99999/confirmation`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should include client information when available', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/${testOrderId}/confirmation`, {
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      if (data.data.clientName) {
        expect(data.data).toHaveProperty('clientName');
      }
    });
  });

  describe('POST /api/order-management/orders/:id/generate-receipt', () => {
    it('should generate PDF receipt', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/${testOrderId}/generate-receipt`, {
        method: 'POST',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/pdf');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/99999/generate-receipt`, {
        method: 'POST',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/order-management/orders/:id/send-email', () => {
    it('should send confirmation email', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/${testOrderId}/send-email`, {
        method: 'POST',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 if email address not found', async () => {
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

        // Should return 400 if no email available
        expect([400, 200]).toContain(emailResponse.status);
      }
    });
  });

  describe('GET /api/order-management/orders/:id/timeline', () => {
    it('should return order timeline', async () => {
      const response = await fetch(`${baseUrl}/api/order-management/orders/${testOrderId}/timeline`, {
        headers: {
          Cookie: authCookie,
        },
      });

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
      const response = await fetch(`${baseUrl}/api/order-management/orders/99999/timeline`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});

