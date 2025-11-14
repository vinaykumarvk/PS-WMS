/**
 * Analytics Routes
 * API endpoints for analytics dashboard
 */

import { Router, type Request, Response } from 'express';
import { getOrderAnalytics, getPerformanceMetrics, getClientInsights } from '../services/analytics-service';

const router = Router();

interface AuthenticatedRequest extends Request {
  session?: {
    userId?: number;
    userRole?: string;
  };
}

/**
 * GET /api/analytics/orders
 * Get order analytics
 */
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
      status: req.query.status as string | undefined,
      transactionType: req.query.transactionType as string | undefined,
    };

    const analytics = await getOrderAnalytics(userId, filters);
    res.json(analytics);
  } catch (error: any) {
    console.error('Order analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get order analytics' });
  }
});

/**
 * GET /api/analytics/performance
 * Get performance metrics
 */
router.get('/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
      status: req.query.status as string | undefined,
      transactionType: req.query.transactionType as string | undefined,
    };

    const metrics = await getPerformanceMetrics(userId, filters);
    res.json(metrics);
  } catch (error: any) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get performance metrics' });
  }
});

/**
 * GET /api/analytics/clients
 * Get client insights
 */
router.get('/clients', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
      status: req.query.status as string | undefined,
      transactionType: req.query.transactionType as string | undefined,
    };

    const insights = await getClientInsights(userId, filters);
    res.json(insights);
  } catch (error: any) {
    console.error('Client insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to get client insights' });
  }
});

export default router;

