import { db } from '../db';
// Note: orders, holdings, portfolios tables will be imported when available
// import { orders, holdings, portfolios } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';

export interface Suggestion {
  id: string;
  type: 'fund_recommendation' | 'amount_optimization' | 'timing_suggestion' | 'portfolio_rebalancing';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    type: 'apply' | 'dismiss' | 'learn_more';
    data?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface SuggestionContext {
  userId: string;
  portfolioId?: string;
  currentOrder?: {
    fundId: string;
    amount: number;
    transactionType: 'purchase' | 'redemption' | 'switch';
  };
  portfolioData?: {
    totalValue: number;
    holdings: Array<{
      fundId: string;
      amount: number;
      percentage: number;
    }>;
  };
}

/**
 * Generate smart suggestions based on user context
 */
export async function generateSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Get user's portfolio data if available
  let portfolioData = context.portfolioData;
  if (!portfolioData && context.portfolioId) {
    portfolioData = await getPortfolioData(context.userId, context.portfolioId);
  }

  // 1. Fund recommendation based on portfolio diversification
  if (portfolioData) {
    const diversificationSuggestions = await generateDiversificationSuggestions(
      context,
      portfolioData
    );
    suggestions.push(...diversificationSuggestions);
  }

  // 2. Amount optimization suggestions
  if (context.currentOrder) {
    const amountSuggestions = await generateAmountOptimizationSuggestions(context);
    suggestions.push(...amountSuggestions);
  }

  // 3. Timing suggestions (market hours, cut-off times)
  const timingSuggestions = await generateTimingSuggestions(context);
  suggestions.push(...timingSuggestions);

  // 4. Portfolio rebalancing suggestions
  if (portfolioData) {
    const rebalancingSuggestions = await generateRebalancingSuggestions(
      context,
      portfolioData
    );
    suggestions.push(...rebalancingSuggestions);
  }

  // Sort by priority
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate diversification suggestions
 */
async function generateDiversificationSuggestions(
  context: SuggestionContext,
  portfolioData: any
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Check if portfolio is too concentrated in one fund
  const maxHoldingPercentage = Math.max(
    ...portfolioData.holdings.map((h: any) => h.percentage)
  );

  if (maxHoldingPercentage > 40) {
    suggestions.push({
      id: `diversification-${Date.now()}`,
      type: 'portfolio_rebalancing',
      title: 'Portfolio Concentration Warning',
      description: `Your portfolio has ${maxHoldingPercentage.toFixed(1)}% in a single fund. Consider diversifying to reduce risk.`,
      priority: 'high',
      action: {
        label: 'View Diversification Options',
        type: 'learn_more',
        data: { maxPercentage: maxHoldingPercentage },
      },
      metadata: { category: 'diversification' },
    });
  }

  // Suggest adding different fund categories
  const fundCategories = portfolioData.holdings.map((h: any) => h.category || 'unknown');
  const uniqueCategories = new Set(fundCategories);

  if (uniqueCategories.size < 3 && portfolioData.totalValue > 100000) {
    suggestions.push({
      id: `category-diversification-${Date.now()}`,
      type: 'fund_recommendation',
      title: 'Expand Fund Categories',
      description: 'Consider adding funds from different categories to improve diversification.',
      priority: 'medium',
      action: {
        label: 'Explore Categories',
        type: 'learn_more',
      },
      metadata: { category: 'diversification', currentCategories: Array.from(uniqueCategories) },
    });
  }

  return suggestions;
}

/**
 * Generate amount optimization suggestions
 */
async function generateAmountOptimizationSuggestions(
  context: SuggestionContext
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  if (!context.currentOrder) return suggestions;

  const { amount, transactionType } = context.currentOrder;

  // Suggest SIP for regular investments
  if (transactionType === 'purchase' && amount >= 5000) {
    suggestions.push({
      id: `sip-suggestion-${Date.now()}`,
      type: 'amount_optimization',
      title: 'Consider SIP Instead',
      description: `Instead of a one-time investment of ₹${amount.toLocaleString()}, consider setting up a SIP of ₹${Math.floor(amount / 12).toLocaleString()}/month for better rupee cost averaging.`,
      priority: 'medium',
      action: {
        label: 'Set Up SIP',
        type: 'apply',
        data: { suggestedAmount: Math.floor(amount / 12) },
      },
      metadata: { category: 'sip' },
    });
  }

  // Suggest minimum investment amounts
  if (amount < 500 && transactionType === 'purchase') {
    suggestions.push({
      id: `minimum-amount-${Date.now()}`,
      type: 'amount_optimization',
      title: 'Minimum Investment',
      description: 'Most mutual funds have a minimum investment of ₹500. Consider increasing your investment amount.',
      priority: 'low',
      action: {
        label: 'Update Amount',
        type: 'apply',
        data: { suggestedAmount: 500 },
      },
      metadata: { category: 'minimum' },
    });
  }

  // Suggest round numbers for easier tracking
  if (amount % 100 !== 0 && amount > 1000) {
    const roundedAmount = Math.round(amount / 100) * 100;
    suggestions.push({
      id: `round-amount-${Date.now()}`,
      type: 'amount_optimization',
      title: 'Round Number Suggestion',
      description: `Consider investing ₹${roundedAmount.toLocaleString()} for easier portfolio tracking.`,
      priority: 'low',
      action: {
        label: 'Use ₹' + roundedAmount.toLocaleString(),
        type: 'apply',
        data: { suggestedAmount: roundedAmount },
      },
      metadata: { category: 'rounding' },
    });
  }

  return suggestions;
}

/**
 * Generate timing suggestions
 */
async function generateTimingSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Market hours: 9:00 AM - 3:30 PM IST, Monday to Friday
  const marketOpenHour = 9;
  const marketCloseHour = 15;
  const marketCloseMinute = 30;

  // Check if market is open
  const isMarketOpen =
    currentDay >= 1 &&
    currentDay <= 5 &&
    (currentHour > marketOpenHour ||
      (currentHour === marketOpenHour && currentMinute >= 0)) &&
    (currentHour < marketCloseHour ||
      (currentHour === marketCloseHour && currentMinute <= marketCloseMinute));

  if (!isMarketOpen) {
    let message = '';
    if (currentDay === 0 || currentDay === 6) {
      message = 'Market is closed on weekends. Your order will be processed on the next trading day.';
    } else if (currentHour < marketOpenHour) {
      const minutesUntilOpen = (marketOpenHour - currentHour) * 60 - currentMinute;
      message = `Market opens in ${minutesUntilOpen} minutes. Orders placed now will be processed at market open.`;
    } else {
      message = 'Market is closed. Your order will be processed on the next trading day.';
    }

    suggestions.push({
      id: `market-hours-${Date.now()}`,
      type: 'timing_suggestion',
      title: 'Market Status',
      description: message,
      priority: 'medium',
      metadata: {
        category: 'market_hours',
        isMarketOpen: false,
        nextTradingDay: getNextTradingDay(now),
      },
    });
  }

  // Cut-off time warning (typically 3:00 PM for equity funds)
  const cutOffHour = 15;
  const cutOffMinute = 0;

  if (
    isMarketOpen &&
    currentHour === cutOffHour &&
    currentMinute < cutOffMinute + 30 &&
    context.currentOrder?.transactionType === 'purchase'
  ) {
    const minutesUntilCutoff = cutOffMinute + 30 - currentMinute;
    suggestions.push({
      id: `cutoff-warning-${Date.now()}`,
      type: 'timing_suggestion',
      title: 'Cut-off Time Approaching',
      description: `Place your order within ${minutesUntilCutoff} minutes to get today's NAV. Orders after 3:30 PM will get tomorrow's NAV.`,
      priority: 'high',
      metadata: {
        category: 'cutoff',
        minutesRemaining: minutesUntilCutoff,
      },
    });
  }

  return suggestions;
}

/**
 * Generate rebalancing suggestions
 */
async function generateRebalancingSuggestions(
  context: SuggestionContext,
  portfolioData: any
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Check if portfolio needs rebalancing
  const targetAllocation = {
    equity: 60,
    debt: 30,
    hybrid: 10,
  };

  const currentAllocation = calculateCurrentAllocation(portfolioData.holdings);

  // Check if deviation is significant (>10%)
  const equityDeviation = Math.abs(currentAllocation.equity - targetAllocation.equity);
  const debtDeviation = Math.abs(currentAllocation.debt - targetAllocation.debt);

  if (equityDeviation > 10 || debtDeviation > 10) {
    suggestions.push({
      id: `rebalancing-${Date.now()}`,
      type: 'portfolio_rebalancing',
      title: 'Portfolio Rebalancing Recommended',
      description: `Your portfolio allocation has drifted from target. Consider rebalancing to maintain your desired asset allocation.`,
      priority: 'medium',
      action: {
        label: 'View Rebalancing Options',
        type: 'learn_more',
        data: {
          current: currentAllocation,
          target: targetAllocation,
        },
      },
      metadata: {
        category: 'rebalancing',
        currentAllocation,
        targetAllocation,
      },
    });
  }

  return suggestions;
}

/**
 * Helper function to get portfolio data
 */
async function getPortfolioData(userId: string, portfolioId: string): Promise<any> {
  // This would typically fetch from database
  // For now, return a placeholder structure
  return null;
}

/**
 * Helper function to calculate current allocation
 */
function calculateCurrentAllocation(holdings: Array<{ category?: string; percentage: number }>): {
  equity: number;
  debt: number;
  hybrid: number;
} {
  const allocation = { equity: 0, debt: 0, hybrid: 0 };

  holdings.forEach((holding) => {
    const category = (holding.category || 'equity').toLowerCase();
    if (category.includes('equity')) {
      allocation.equity += holding.percentage;
    } else if (category.includes('debt') || category.includes('bond')) {
      allocation.debt += holding.percentage;
    } else {
      allocation.hybrid += holding.percentage;
    }
  });

  return allocation;
}

/**
 * Helper function to get next trading day
 */
function getNextTradingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

