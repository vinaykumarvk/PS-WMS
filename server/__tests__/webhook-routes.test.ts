/**
 * Module 10.2: Webhook Routes Tests
 * Tests for Webhook API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';

describe('Webhook API Routes', () => {
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

  describe('POST /api/webhooks', () => {
    it('should create a webhook with valid data', async () => {
      mockReq.body = {
        url: 'https://example.com/webhooks',
        events: ['order.created', 'order.updated'],
      };

      const { createWebhook } = await import('../services/webhook-service');
      const webhook = await createWebhook(1, mockReq.body);

      expect(webhook).toBeDefined();
      expect(webhook.url).toBe(mockReq.body.url);
      expect(webhook.events).toEqual(mockReq.body.events);
      expect(webhook.secret).toBeDefined();
      expect(webhook.id).toBeDefined();
    });

    it('should reject invalid URL', async () => {
      mockReq.body = {
        url: 'not-a-valid-url',
        events: ['order.created'],
      };

      const { createWebhook } = await import('../services/webhook-service');
      
      await expect(createWebhook(1, mockReq.body)).rejects.toThrow();
    });

    it('should reject empty events array', async () => {
      mockReq.body = {
        url: 'https://example.com/webhooks',
        events: [],
      };

      const { createWebhook } = await import('../services/webhook-service');
      
      await expect(createWebhook(1, mockReq.body)).rejects.toThrow();
    });
  });

  describe('GET /api/webhooks', () => {
    it('should list all webhooks for user', async () => {
      const { createWebhook, getUserWebhooks } = await import('../services/webhook-service');
      
      // Create a test webhook
      await createWebhook(1, {
        url: 'https://example.com/webhooks',
        events: ['order.created'],
      });

      const webhooks = await getUserWebhooks(1);
      expect(Array.isArray(webhooks)).toBe(true);
    });
  });

  describe('GET /api/webhooks/:id', () => {
    it('should get webhook by ID', async () => {
      const { createWebhook, getWebhookById } = await import('../services/webhook-service');
      
      const webhook = await createWebhook(1, {
        url: 'https://example.com/webhooks',
        events: ['order.created'],
      });

      const retrieved = await getWebhookById(webhook.id, 1);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(webhook.id);
    });

    it('should return null for non-existent webhook', async () => {
      const { getWebhookById } = await import('../services/webhook-service');
      
      const retrieved = await getWebhookById('non-existent', 1);
      expect(retrieved).toBeNull();
    });
  });

  describe('PUT /api/webhooks/:id', () => {
    it('should update webhook', async () => {
      const { createWebhook, updateWebhook } = await import('../services/webhook-service');
      
      const webhook = await createWebhook(1, {
        url: 'https://example.com/webhooks',
        events: ['order.created'],
      });

      const updated = await updateWebhook(webhook.id, 1, {
        url: 'https://new-url.com/webhooks',
        active: false,
      });

      expect(updated.url).toBe('https://new-url.com/webhooks');
      expect(updated.active).toBe(false);
    });
  });

  describe('DELETE /api/webhooks/:id', () => {
    it('should delete webhook', async () => {
      const { createWebhook, deleteWebhook, getWebhookById } = await import('../services/webhook-service');
      
      const webhook = await createWebhook(1, {
        url: 'https://example.com/webhooks',
        events: ['order.created'],
      });

      const deleted = await deleteWebhook(webhook.id, 1);
      expect(deleted).toBe(true);

      const retrieved = await getWebhookById(webhook.id, 1);
      expect(retrieved).toBeNull();
    });
  });

  describe('POST /api/webhooks/:id/test', () => {
    it('should deliver test webhook', async () => {
      const { createWebhook, deliverWebhook } = await import('../services/webhook-service');
      
      const webhook = await createWebhook(1, {
        url: 'https://example.com/webhooks',
        events: ['order.created'],
      });

      // Mock fetch for webhook delivery
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      } as Response);

      const delivery = await deliverWebhook(webhook, 'order.created', { test: true });
      
      expect(delivery).toBeDefined();
      expect(delivery.status).toBe('delivered');
    });
  });

  describe('Webhook Signature', () => {
    it('should generate and verify webhook signature', async () => {
      const { generateWebhookSignature, verifyWebhookSignature } = await import('../services/webhook-service');
      
      const payload = JSON.stringify({ test: true });
      const secret = 'test-secret';
      
      const signature = generateWebhookSignature(payload, secret);
      expect(signature).toBeDefined();
      
      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
      
      const isInvalid = verifyWebhookSignature(payload, signature, 'wrong-secret');
      expect(isInvalid).toBe(false);
    });
  });
});

