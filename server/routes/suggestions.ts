import { Router, Request, Response } from 'express';
import { generateSuggestions, SuggestionContext } from '../services/suggestion-service';
import {
  checkConflicts,
  checkPortfolioLimits,
  ValidationContext,
} from '../services/validation-service';

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
 * POST /api/suggestions/generate
 * Generate smart suggestions based on user context
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { portfolioId, currentOrder, portfolioData } = req.body;

    const context: SuggestionContext = {
      userId,
      portfolioId,
      currentOrder,
      portfolioData,
    };

    const suggestions = await generateSuggestions(context);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
    });
  }
});

/**
 * POST /api/validation/check-conflicts
 * Check for conflicts in an order
 */
router.post('/check-conflicts', authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { portfolioId, order } = req.body;

    if (!order || !order.fundId || !order.amount || !order.transactionType) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
      });
    }

    const context: ValidationContext = {
      userId,
      portfolioId,
      order: {
        fundId: order.fundId,
        amount: order.amount,
        transactionType: order.transactionType,
        orderType: order.orderType,
      },
    };

    const conflicts = await checkConflicts(context);

    res.json({
      success: true,
      data: conflicts,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
    });
  }
});

/**
 * POST /api/validation/portfolio-limits
 * Check portfolio limits
 */
router.post('/portfolio-limits', authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { portfolioId, newOrderAmount, fundId } = req.body;

    if (!portfolioId || !newOrderAmount || !fundId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: portfolioId, newOrderAmount, fundId',
      });
    }

    const limits = await checkPortfolioLimits(userId, portfolioId, newOrderAmount, fundId);

    res.json({
      success: true,
      data: limits,
    });
  } catch (error) {
    console.error('Error checking portfolio limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check portfolio limits',
    });
  }
});

/**
 * GET /api/market-hours
 * Get market hours and cut-off times
 */
router.get('/market-hours', async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    const marketOpenHour = 9;
    const marketCloseHour = 15;
    const marketCloseMinute = 30;
    const cutOffHour = 15;
    const cutOffMinute = 0;

    const isMarketOpen =
      currentDay >= 1 &&
      currentDay <= 5 &&
      (currentHour > marketOpenHour ||
        (currentHour === marketOpenHour && currentMinute >= 0)) &&
      (currentHour < marketCloseHour ||
        (currentHour === marketCloseHour && currentMinute <= marketCloseMinute));

    const isBeforeCutOff =
      isMarketOpen &&
      (currentHour < cutOffHour ||
        (currentHour === cutOffHour && currentMinute <= cutOffMinute + 30));

    const minutesUntilCutOff = isMarketOpen
      ? Math.max(
          0,
          (cutOffHour - currentHour) * 60 + (cutOffMinute + 30 - currentMinute)
        )
      : null;

    const nextTradingDay = getNextTradingDay(now);

    res.json({
      success: true,
      data: {
        isMarketOpen,
        isBeforeCutOff,
        marketHours: {
          open: '09:00',
          close: '15:30',
          cutOff: '15:30',
        },
        currentTime: {
          hour: currentHour,
          minute: currentMinute,
          day: currentDay,
        },
        minutesUntilCutOff,
        nextTradingDay: nextTradingDay.toISOString(),
        timezone: 'IST',
      },
    });
  } catch (error) {
    console.error('Error getting market hours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market hours',
    });
  }
});

/**
 * Helper function to get next trading day
 */
function getNextTradingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

export default router;

