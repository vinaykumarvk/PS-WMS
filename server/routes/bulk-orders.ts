/**
 * Bulk Order Routes
 * Handles bulk order submission and status tracking
 */

import { Router, Request, Response } from 'express';
import {
  createBulkOrderBatch,
  getBulkOrderBatch,
  getUserBulkOrderBatches,
  type BulkOrderRequest,
} from '../services/bulk-order-service';
import { triggerWebhooks } from '../services/webhook-service';

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

/**
 * POST /api/bulk-orders
 * Submit bulk orders
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const request: BulkOrderRequest = req.body;

    // Validate request
    if (!request.orders || !Array.isArray(request.orders) || request.orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Orders array is required and cannot be empty',
        errors: ['At least one order is required'],
      });
    }

    if (request.orders.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Too many orders',
        errors: ['Maximum 100 orders per batch'],
      });
    }

    // Get client IP address
    const ipAddress = req.ip || 
      (req.headers['x-forwarded-for'] as string) || 
      req.connection.remoteAddress || 
      'unknown';

    // Create bulk order batch
    const batch = await createBulkOrderBatch(userId, request, ipAddress);

    // Trigger webhook if not validate-only
    if (!request.options?.validateOnly) {
      triggerWebhooks(userId, 'order.created', {
        batchId: batch.batchId,
        total: batch.total,
        type: 'bulk',
      }).catch((error) => {
        console.error('Failed to trigger webhook for bulk order:', error);
      });
    }

    // Return summary
    res.status(202).json({
      success: true,
      batchId: batch.batchId,
      message: request.options?.validateOnly
        ? 'Orders validated successfully'
        : 'Bulk order submitted for processing',
      summary: {
        total: batch.total,
        submitted: batch.succeeded,
        failed: batch.failed,
        errors: batch.results
          .filter((r) => !r.success)
          .map((r) => ({
            index: r.index,
            error: r.error,
          })),
      },
    });
  } catch (error: any) {
    console.error('Submit bulk orders error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit bulk orders',
      error: error.message,
    });
  }
});

/**
 * GET /api/bulk-orders/:batchId
 * Get bulk order batch status
 */
router.get('/:batchId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const batchId = req.params.batchId;

    const batch = await getBulkOrderBatch(batchId, userId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Bulk order batch not found',
      });
    }

    res.json({
      batchId: batch.batchId,
      status: batch.status,
      total: batch.total,
      processed: batch.processed,
      succeeded: batch.succeeded,
      failed: batch.failed,
      orders: batch.orders,
      errors: batch.results
        .filter((r) => !r.success)
        .map((r) => ({
          index: r.index,
          error: r.error,
        })),
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    });
  } catch (error: any) {
    console.error('Get bulk order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bulk order status',
      error: error.message,
    });
  }
});

/**
 * GET /api/bulk-orders
 * Get all bulk order batches for the current user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const batches = await getUserBulkOrderBatches(userId, limit);

    res.json(batches.map((batch) => ({
      batchId: batch.batchId,
      status: batch.status,
      total: batch.total,
      processed: batch.processed,
      succeeded: batch.succeeded,
      failed: batch.failed,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    })));
  } catch (error: any) {
    console.error('Get bulk orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bulk orders',
      error: error.message,
    });
  }
});

export default router;

