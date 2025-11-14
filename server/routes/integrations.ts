/**
 * Integration Routes
 * Handles partner integration management
 */

import { Router, Request, Response } from 'express';
import {
  createIntegration,
  getIntegrationById,
  getUserIntegrations,
  updateIntegration,
  regenerateApiCredentials,
  deleteIntegration,
  getIntegrationUsageLogs,
  type IntegrationType,
} from '../services/integration-service';
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
const integrationCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'payment_gateway',
    'rta',
    'nav_provider',
    'email_service',
    'sms_service',
    'analytics',
    'custom',
  ]),
  config: z.record(z.any()).optional(),
  webhookUrl: z.string().url().optional(),
});

const integrationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  config: z.record(z.any()).optional(),
  webhookUrl: z.string().url().optional(),
});

/**
 * GET /api/integrations
 * List all integrations for the current user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const type = req.query.type as IntegrationType | undefined;

    const integrations = await getUserIntegrations(userId, type);

    // Don't expose secrets in list
    res.json(integrations.map((int) => ({
      id: int.id,
      name: int.name,
      type: int.type,
      status: int.status,
      webhookUrl: int.webhookUrl,
      createdAt: int.createdAt,
      updatedAt: int.updatedAt,
      lastUsedAt: int.lastUsedAt,
      usageCount: int.usageCount,
    })));
  } catch (error: any) {
    console.error('List integrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list integrations',
      error: error.message,
    });
  }
});

/**
 * POST /api/integrations
 * Create a new integration
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;

    // Validate request
    const validation = integrationCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const integration = await createIntegration(userId, validation.data);

    res.status(201).json({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      apiKey: integration.apiKey,
      apiSecret: integration.apiSecret, // Only shown once on creation
      webhookUrl: integration.webhookUrl,
      webhookSecret: integration.webhookSecret,
      createdAt: integration.createdAt,
    });
  } catch (error: any) {
    console.error('Create integration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create integration',
      error: error.message,
    });
  }
});

/**
 * GET /api/integrations/:id
 * Get integration by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const integrationId = req.params.id;

    const integration = await getIntegrationById(integrationId, userId);
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    // Don't expose secret in response
    res.json({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      apiKey: integration.apiKey,
      webhookUrl: integration.webhookUrl,
      config: integration.config,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      lastUsedAt: integration.lastUsedAt,
      usageCount: integration.usageCount,
    });
  } catch (error: any) {
    console.error('Get integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration',
      error: error.message,
    });
  }
});

/**
 * PUT /api/integrations/:id
 * Update integration
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const integrationId = req.params.id;

    // Validate request
    const validation = integrationUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const integration = await updateIntegration(integrationId, userId, validation.data);

    res.json({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      webhookUrl: integration.webhookUrl,
      config: integration.config,
      updatedAt: integration.updatedAt,
    });
  } catch (error: any) {
    console.error('Update integration error:', error);
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update integration',
      error: error.message,
    });
  }
});

/**
 * POST /api/integrations/:id/regenerate-credentials
 * Regenerate API credentials
 */
router.post('/:id/regenerate-credentials', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const integrationId = req.params.id;

    const credentials = await regenerateApiCredentials(integrationId, userId);

    res.json({
      success: true,
      message: 'API credentials regenerated successfully',
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret, // Only shown once on regeneration
    });
  } catch (error: any) {
    console.error('Regenerate credentials error:', error);
    if (error.message === 'Integration not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate credentials',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/integrations/:id
 * Delete integration
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const integrationId = req.params.id;

    const deleted = await deleteIntegration(integrationId, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete integration',
      error: error.message,
    });
  }
});

/**
 * GET /api/integrations/:id/usage
 * Get integration usage logs
 */
router.get('/:id/usage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const integrationId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await getIntegrationUsageLogs(integrationId, userId, limit);

    res.json(logs);
  } catch (error: any) {
    console.error('Get integration usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration usage',
      error: error.message,
    });
  }
});

export default router;

