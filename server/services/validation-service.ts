import { db } from '../db';
// Note: orders, holdings, portfolios tables will be imported when available
// import { orders, holdings, portfolios } from '../db/schema';
import { eq, and, or, gte, lte, sql } from 'drizzle-orm';

export interface Conflict {
  type: 'duplicate_order' | 'insufficient_balance' | 'limit_exceeded' | 'timing_conflict';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
}

export interface PortfolioLimit {
  type: 'single_fund_limit' | 'category_limit' | 'total_portfolio_limit';
  current: number;
  limit: number;
  percentage: number;
  message: string;
}

export interface ValidationContext {
  userId: string;
  portfolioId?: string;
  order: {
    fundId: string;
    amount: number;
    transactionType: 'purchase' | 'redemption' | 'switch';
    orderType?: 'lump_sum' | 'sip';
  };
}

/**
 * Check for conflicts in the order
 */
export async function checkConflicts(context: ValidationContext): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  // 1. Check for duplicate orders
  const duplicateConflicts = await checkDuplicateOrders(context);
  conflicts.push(...duplicateConflicts);

  // 2. Check for insufficient balance (for redemptions)
  if (context.order.transactionType === 'redemption') {
    const balanceConflicts = await checkInsufficientBalance(context);
    conflicts.push(...balanceConflicts);
  }

  // 3. Check for timing conflicts
  const timingConflicts = await checkTimingConflicts(context);
  conflicts.push(...timingConflicts);

  return conflicts;
}

/**
 * Check for duplicate orders
 */
async function checkDuplicateOrders(context: ValidationContext): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  try {
    // Check for orders with same fund, amount, and transaction type within last hour
    // TODO: Uncomment when orders table is available in schema
    /*
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const duplicateOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, context.userId),
          eq(orders.fundId, context.order.fundId),
          eq(orders.transactionType, context.order.transactionType),
          eq(orders.status, 'pending'),
          gte(orders.createdAt, oneHourAgo)
        )
      )
      .limit(5);
    */
    const duplicateOrders: any[] = []; // Placeholder until orders table is available

    if (duplicateOrders.length > 0) {
      // Check if amount is similar (within 5%)
      const similarOrder = duplicateOrders.find((order) => {
        const amountDiff = Math.abs(order.amount - context.order.amount);
        const percentageDiff = (amountDiff / order.amount) * 100;
        return percentageDiff < 5;
      });

      if (similarOrder) {
        conflicts.push({
          type: 'duplicate_order',
          severity: 'warning',
          message: `A similar order was placed ${getTimeAgo(similarOrder.createdAt)}. Are you sure you want to proceed?`,
          details: {
            previousOrderId: similarOrder.id,
            previousAmount: similarOrder.amount,
            timeDifference: getTimeAgo(similarOrder.createdAt),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking duplicate orders:', error);
  }

  return conflicts;
}

/**
 * Check for insufficient balance
 */
async function checkInsufficientBalance(context: ValidationContext): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  try {
    // Get user's holdings for this fund
    // TODO: Uncomment when holdings table is available in schema
    /*
    const holdings = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, context.userId),
          eq(holdings.fundId, context.order.fundId)
        )
      )
      .limit(1);
    */
    const holdings: any[] = []; // Placeholder until holdings table is available

    if (holdings.length === 0) {
      conflicts.push({
        type: 'insufficient_balance',
        severity: 'error',
        message: 'You do not have any holdings in this fund.',
        details: {
          fundId: context.order.fundId,
        },
      });
      return conflicts;
    }

    const holding = holdings[0];
    const availableUnits = holding.units || 0;
    const estimatedValue = availableUnits * (holding.currentNav || 0);

    if (context.order.amount > estimatedValue) {
      conflicts.push({
        type: 'insufficient_balance',
        severity: 'error',
        message: `Insufficient balance. Available: ₹${estimatedValue.toLocaleString()}, Requested: ₹${context.order.amount.toLocaleString()}`,
        details: {
          availableValue: estimatedValue,
          requestedAmount: context.order.amount,
          availableUnits,
        },
      });
    } else if (context.order.amount > estimatedValue * 0.95) {
      // Warning if using more than 95% of available balance
      conflicts.push({
        type: 'insufficient_balance',
        severity: 'warning',
        message: `You are redeeming ${((context.order.amount / estimatedValue) * 100).toFixed(1)}% of your holdings. Consider keeping some balance for future needs.`,
        details: {
          percentage: (context.order.amount / estimatedValue) * 100,
        },
      });
    }
  } catch (error) {
    console.error('Error checking insufficient balance:', error);
  }

  return conflicts;
}

/**
 * Check for timing conflicts
 */
async function checkTimingConflicts(context: ValidationContext): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay();

  // Check if it's a weekend
  if (currentDay === 0 || currentDay === 6) {
    conflicts.push({
      type: 'timing_conflict',
      severity: 'info',
      message: 'Orders placed on weekends will be processed on the next trading day.',
      details: {
        nextTradingDay: getNextTradingDay(now),
      },
    });
  }

  // Check if market is closed
  const marketOpenHour = 9;
  const marketCloseHour = 15;
  const marketCloseMinute = 30;

  if (
    currentDay >= 1 &&
    currentDay <= 5 &&
    (currentHour < marketOpenHour ||
      currentHour > marketCloseHour ||
      (currentHour === marketCloseHour && currentMinute > marketCloseMinute))
  ) {
    conflicts.push({
      type: 'timing_conflict',
      severity: 'info',
      message: 'Market is currently closed. Your order will be processed on the next trading day.',
      details: {
        marketOpenTime: '09:00 AM',
        marketCloseTime: '03:30 PM',
      },
    });
  }

  return conflicts;
}

/**
 * Check portfolio limits
 */
export async function checkPortfolioLimits(
  userId: string,
  portfolioId: string,
  newOrderAmount: number,
  fundId: string
): Promise<PortfolioLimit[]> {
  const limits: PortfolioLimit[] = [];

  try {
    // Get portfolio data
    // TODO: Uncomment when portfolios and holdings tables are available in schema
    /*
    const portfolio = await db
      .select()
      .from(portfolios)
      .where(
        and(eq(portfolios.userId, userId), eq(portfolios.id, portfolioId))
      )
      .limit(1);

    if (portfolio.length === 0) {
      return limits;
    }

    const portfolioData = portfolio[0];

    // Get all holdings
    const allHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));
    */
    
    // Placeholder until tables are available
    const portfolio: any[] = [];
    if (portfolio.length === 0) {
      return limits;
    }
    const portfolioData = { maxInvestmentLimit: Infinity };
    const allHoldings: any[] = [];

    const totalPortfolioValue = allHoldings.reduce(
      (sum, h) => sum + (h.units || 0) * (h.currentNav || 0),
      0
    );

    const newTotalValue = totalPortfolioValue + newOrderAmount;

    // Check single fund limit (typically 40% of portfolio)
    const singleFundLimit = newTotalValue * 0.4;
    const currentFundValue = allHoldings
      .filter((h) => h.fundId === fundId)
      .reduce((sum, h) => sum + (h.units || 0) * (h.currentNav || 0), 0);
    const newFundValue = currentFundValue + newOrderAmount;

    if (newFundValue > singleFundLimit) {
      limits.push({
        type: 'single_fund_limit',
        current: newFundValue,
        limit: singleFundLimit,
        percentage: (newFundValue / newTotalValue) * 100,
        message: `This investment would result in ${((newFundValue / newTotalValue) * 100).toFixed(1)}% allocation to a single fund, exceeding the recommended limit of 40%.`,
      });
    }

    // Check total portfolio limit (if user has investment limits)
    // This would typically come from user profile or KYC data
    const maxPortfolioLimit = portfolioData.maxInvestmentLimit || Infinity;
    if (newTotalValue > maxPortfolioLimit) {
      limits.push({
        type: 'total_portfolio_limit',
        current: newTotalValue,
        limit: maxPortfolioLimit,
        percentage: (newTotalValue / maxPortfolioLimit) * 100,
        message: `This investment would exceed your portfolio limit of ₹${maxPortfolioLimit.toLocaleString()}.`,
      });
    }
  } catch (error) {
    console.error('Error checking portfolio limits:', error);
  }

  return limits;
}

/**
 * Helper function to get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

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

