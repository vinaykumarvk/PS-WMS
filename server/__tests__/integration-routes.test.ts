/**
 * Module 10.4: Integration Routes Tests
 * Tests for Integration API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';

describe('Integration API Routes', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
      session: {
        userId: 1,
      } as any,
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe('POST /api/integrations', () => {
    it('should create integration with valid data', async () => {
      mockReq.body = {
        name: 'Test Payment Gateway',
        type: 'payment_gateway',
        config: {
          merchantId: 'MERCHANT123',
        },
        webhookUrl: 'https://example.com/webhooks',
      };

      const { createIntegration } = await import('../services/integration-service');
      const integration = await createIntegration(1, mockReq.body);

      expect(integration).toBeDefined();
      expect(integration.name).toBe(mockReq.body.name);
      expect(integration.type).toBe(mockReq.body.type);
      expect(integration.apiKey).toBeDefined();
      expect(integration.apiSecret).toBeDefined();
      expect(integration.status).toBe('pending');
    });

    it('should reject invalid webhook URL', async () => {
      mockReq.body = {
        name: 'Test Integration',
        type: 'payment_gateway',
        webhookUrl: 'not-a-valid-url',
      };

      const { createIntegration } = await import('../services/integration-service');
      
      await expect(createIntegration(1, mockReq.body)).rejects.toThrow();
    });
  });

  describe('GET /api/integrations', () => {
    it('should list all integrations for user', async () => {
      const { createIntegration, getUserIntegrations } = await import('../services/integration-service');
      
      await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      const integrations = await getUserIntegrations(1);
      expect(Array.isArray(integrations)).toBe(true);
    });

    it('should filter integrations by type', async () => {
      const { createIntegration, getUserIntegrations } = await import('../services/integration-service');
      
      await createIntegration(1, {
        name: 'Payment Gateway',
        type: 'payment_gateway',
      });

      await createIntegration(1, {
        name: 'RTA Integration',
        type: 'rta',
      });

      const paymentIntegrations = await getUserIntegrations(1, 'payment_gateway');
      expect(paymentIntegrations.every(int => int.type === 'payment_gateway')).toBe(true);
    });
  });

  describe('GET /api/integrations/:id', () => {
    it('should get integration by ID', async () => {
      const { createIntegration, getIntegrationById } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      const retrieved = await getIntegrationById(integration.id, 1);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(integration.id);
    });

    it('should return null for non-existent integration', async () => {
      const { getIntegrationById } = await import('../services/integration-service');
      
      const retrieved = await getIntegrationById('non-existent', 1);
      expect(retrieved).toBeNull();
    });
  });

  describe('PUT /api/integrations/:id', () => {
    it('should update integration', async () => {
      const { createIntegration, updateIntegration } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      const updated = await updateIntegration(integration.id, 1, {
        name: 'Updated Integration',
        status: 'active',
      });

      expect(updated.name).toBe('Updated Integration');
      expect(updated.status).toBe('active');
    });
  });

  describe('POST /api/integrations/:id/regenerate-credentials', () => {
    it('should regenerate API credentials', async () => {
      const { createIntegration, regenerateApiCredentials, getIntegrationById } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      const oldApiKey = integration.apiKey;
      const oldApiSecret = integration.apiSecret;

      const credentials = await regenerateApiCredentials(integration.id, 1);
      
      expect(credentials.apiKey).toBeDefined();
      expect(credentials.apiSecret).toBeDefined();
      expect(credentials.apiKey).not.toBe(oldApiKey);
      expect(credentials.apiSecret).not.toBe(oldApiSecret);

      const updated = await getIntegrationById(integration.id, 1);
      expect(updated?.apiKey).toBe(credentials.apiKey);
    });
  });

  describe('DELETE /api/integrations/:id', () => {
    it('should delete integration', async () => {
      const { createIntegration, deleteIntegration, getIntegrationById } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      const deleted = await deleteIntegration(integration.id, 1);
      expect(deleted).toBe(true);

      const retrieved = await getIntegrationById(integration.id, 1);
      expect(retrieved).toBeNull();
    });
  });

  describe('API Credential Verification', () => {
    it('should verify valid API credentials', async () => {
      const { createIntegration, verifyApiCredentials } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      // Activate integration
      const { updateIntegration } = await import('../services/integration-service');
      await updateIntegration(integration.id, 1, { status: 'active' });

      const verified = await verifyApiCredentials(integration.apiKey, integration.apiSecret);
      expect(verified).toBeDefined();
      expect(verified?.id).toBe(integration.id);
    });

    it('should reject invalid API credentials', async () => {
      const { verifyApiCredentials } = await import('../services/integration-service');
      
      const verified = await verifyApiCredentials('invalid-key', 'invalid-secret');
      expect(verified).toBeNull();
    });
  });

  describe('Usage Logging', () => {
    it('should log integration usage', async () => {
      const { createIntegration, logIntegrationUsage, getIntegrationUsageLogs } = await import('../services/integration-service');
      
      const integration = await createIntegration(1, {
        name: 'Test Integration',
        type: 'payment_gateway',
      });

      await logIntegrationUsage(integration.id, {
        endpoint: '/api/test',
        method: 'POST',
        statusCode: 200,
        responseTime: 150,
      });

      const logs = await getIntegrationUsageLogs(integration.id, 1);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].endpoint).toBe('/api/test');
    });
  });
});

