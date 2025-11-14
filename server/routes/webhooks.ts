/**
 * Webhook Routes
 * Handles webhook registration, management, and testing
 */

import { Router, Request, Response } from 'express';
import {
  createWebhook,
  getWebhookById,
  getUserWebhooks,
  updateWebhook,
  deleteWebhook,
  deliverWebhook,
  getWebhookDeliveries,
  retryWebhookDelivery,
  type WebhookEvent,
} from '../services/webhook-service';
import { z } from 'zod';

const router = Router();

// Auth middleware helper
const authMiddleware = (req: Request, res: Response, next: Function) => {
  try {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  } catch (error: any) {
    console.error('[authMiddleware] Error:', error);
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

// Validation schemas
const webhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'order.created',
    'order.updated',
    'order.completed',
    'order.failed',
    'payment.received',
    'payment.failed',
  ])).min(1),
  secret: z.string().optional(),
});

const webhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum([
    'order.created',
    'order.updated',
    'order.completed',
    'order.failed',
    'payment.received',
    'payment.failed',
  ])).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/webhooks
 * List all webhooks for the current user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhooks = await getUserWebhooks(userId);

    res.json(webhooks);
  } catch (error: any) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list webhooks',
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    
    // Validate request
    const validation = webhookCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const webhook = await createWebhook(userId, validation.data);

    res.status(201).json(webhook);
  } catch (error: any) {
    console.error('Create webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create webhook',
      error: error.message,
    });
  }
});

/**
 * GET /api/webhooks/:id
 * Get webhook by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;

    const webhook = await getWebhookById(webhookId, userId);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    res.json(webhook);
  } catch (error: any) {
    console.error('Get webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get webhook',
      error: error.message,
    });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;

    // Validate request
    const validation = webhookUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const webhook = await updateWebhook(webhookId, userId, validation.data);

    res.json(webhook);
  } catch (error: any) {
    console.error('Update webhook error:', error);
    if (error.message === 'Webhook not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update webhook',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;

    const deleted = await deleteWebhook(webhookId, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook',
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test webhook by sending a test event
 */
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;

    const webhook = await getWebhookById(webhookId, userId);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    // Send test event
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
    };

    const delivery = await deliverWebhook(webhook, 'order.created', testPayload);

    res.json({
      success: delivery.status === 'delivered',
      message: delivery.status === 'delivered' 
        ? 'Test event sent successfully' 
        : `Test event failed: ${delivery.error}`,
      delivery: {
        id: delivery.id,
        status: delivery.status,
        responseCode: delivery.responseCode,
        error: delivery.error,
      },
    });
  } catch (error: any) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test webhook',
      error: error.message,
    });
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get webhook delivery history
 */
router.get('/:id/deliveries', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const deliveries = await getWebhookDeliveries(webhookId, userId, limit);

    res.json(deliveries);
  } catch (error: any) {
    console.error('Get webhook deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get webhook deliveries',
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks/:id/deliveries/:deliveryId/retry
 * Retry failed webhook delivery
 */
router.post('/:id/deliveries/:deliveryId/retry', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const deliveryId = req.params.deliveryId;
    const maxRetries = parseInt(req.query.maxRetries as string) || 5;

    const delivery = await retryWebhookDelivery(deliveryId, userId, maxRetries);

    res.json({
      success: delivery.status === 'delivered',
      message: delivery.status === 'delivered'
        ? 'Webhook retried successfully'
        : `Webhook retry failed: ${delivery.error}`,
      delivery,
    });
  } catch (error: any) {
    console.error('Retry webhook delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry webhook delivery',
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks/:id/retry-failed
 * Retry all failed deliveries for a webhook
 */
router.post('/:id/retry-failed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const webhookId = req.params.id;
    const maxRetries = parseInt(req.query.maxRetries as string) || 5;

    const { retryFailedDeliveries } = await import('../services/webhook-service');
    const results = await retryFailedDeliveries(webhookId, userId, maxRetries);

    res.json({
      success: true,
      message: `Retried ${results.length} failed deliveries`,
      results: results.map(del => ({
        id: del.id,
        status: del.status,
        attempts: del.attempts,
        error: del.error,
      })),
    });
  } catch (error: any) {
    console.error('Retry failed deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry failed deliveries',
      error: error.message,
    });
  }
});

export default router;

