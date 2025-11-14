/**
 * Portfolio Analysis Service
 * Module B: Portfolio-Aware Ordering
 * Handles portfolio calculations, impact analysis, and rebalancing suggestions
 */

import { db } from '../db';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { transactions, products, clients } from '@shared/schema';
import { supabaseServer } from '../lib/supabase';
import type {
  PortfolioData,
  PortfolioAllocation,
  PortfolioImpact,
  AllocationChange,
  AllocationGap,
  RebalancingSuggestion,
  Holding,
  TargetAllocation,
} from '@shared/types/portfolio.types';
import type { CartItem } from '@shared/types/order-management.types';
import type { APIResponse } from '@shared/types/api.types';

/**
 * Map product category to portfolio allocation category
 */
function mapCategoryToAllocation(category: string | null | undefined): 'equity' | 'debt' | 'hybrid' | 'others' {
  if (!category) return 'others';
  
  const normalized = category.toLowerCase();
  
  // Equity categories
  if (
    normalized.includes('equity') ||
    normalized.includes('large_cap') ||
    normalized.includes('mid_cap') ||
    normalized.includes('small_cap') ||
    normalized.includes('multi_cap') ||
    normalized.includes('thematic') ||
    normalized.includes('elss') ||
    normalized === 'equity'
  ) {
    return 'equity';
  }
  
  // Debt categories
  if (
    normalized.includes('debt') ||
    normalized.includes('bond') ||
    normalized.includes('fixed_deposit') ||
    normalized.includes('fd') ||
    normalized === 'debt'
  ) {
    return 'debt';
  }
  
  // Hybrid categories
  if (
    normalized.includes('hybrid') ||
    normalized.includes('balanced') ||
    normalized.includes('aggressive') ||
    normalized === 'hybrid'
  ) {
    return 'hybrid';
  }
  
  return 'others';
}

/**
 * Get current portfolio data for a client
 */
export async function getPortfolio(
  clientId: number,
  includeHoldings: boolean = true
): Promise<APIResponse<PortfolioData>> {
  try {
    // Get client data
    let client: any;
    if (db && typeof db.select === 'function') {
      const clientRows = await db.select().from(clients).where(eq(clients.id, clientId));
      client = Array.isArray(clientRows) && clientRows.length > 0 ? clientRows[0] : null;
    } else {
      const { data: clientRow, error: clientErr } = await supabaseServer
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (clientErr) throw clientErr;
      client = clientRow;
    }

    if (!client) {
      return {
        success: false,
        message: 'Client not found',
        errors: ['Client not found'],
      };
    }

    // Get all transactions for the client
    let clientTransactions: any[] = [];
    if (db && typeof db.select === 'function') {
      const txnRows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.clientId, clientId))
        .orderBy(desc(transactions.transactionDate));
      clientTransactions = Array.isArray(txnRows) ? txnRows : [];
    } else {
      const { data: txnRows, error: txnErr } = await supabaseServer
        .from('transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('transaction_date', { ascending: false });
      if (txnErr) throw txnErr;
      clientTransactions = txnRows || [];
    }

    // Calculate portfolio allocation
    const allocation: PortfolioAllocation = {
      equity: 0,
      debt: 0,
      hybrid: 0,
      others: 0,
    };

    let totalInvested = 0;
    let totalValue = 0;
    const holdingsMap = new Map<number, Holding>();

    // Process transactions to calculate holdings and allocation
    clientTransactions.forEach((txn: any) => {
      const transactionType = (txn.transactionType || txn.transaction_type || '').toLowerCase();
      const amount = Math.abs(txn.amount || txn.totalAmount || 0);
      const productCategory = txn.productCategory || txn.product_category || txn.productType || txn.product_type;
      const productId = txn.productId || txn.product_id;
      const productName = txn.productName || txn.product_name || 'Unknown';
      const nav = txn.price || txn.nav || 1;
      const quantity = txn.quantity || (amount / nav);

      if (transactionType === 'buy' || transactionType === 'purchase') {
        totalInvested += amount;
        totalValue += amount; // Simplified - in real scenario, use current NAV

        const allocCategory = mapCategoryToAllocation(productCategory);
        allocation[allocCategory] += amount;

        // Build holdings
        if (includeHoldings && productId) {
          const existing = holdingsMap.get(productId);
          if (existing) {
            existing.units += quantity;
            existing.investedAmount += amount;
            existing.currentValue += amount; // Simplified
          } else {
            holdingsMap.set(productId, {
              id: productId,
              productId,
              schemeName: productName,
              category: allocCategory,
              units: quantity,
              nav,
              currentValue: amount,
              investedAmount: amount,
              gainLoss: 0, // Simplified
              gainLossPercent: 0,
              purchaseDate: new Date(txn.transactionDate || txn.transaction_date).toISOString(),
              lastTransactionDate: new Date(txn.transactionDate || txn.transaction_date).toISOString(),
            });
          }
        }
      } else if (transactionType === 'sell' || transactionType === 'redemption') {
        totalInvested -= amount;
        totalValue -= amount;

        const allocCategory = mapCategoryToAllocation(productCategory);
        allocation[allocCategory] = Math.max(0, allocation[allocCategory] - amount);

        if (includeHoldings && productId) {
          const existing = holdingsMap.get(productId);
          if (existing) {
            existing.units = Math.max(0, existing.units - quantity);
            existing.investedAmount = Math.max(0, existing.investedAmount - amount);
            existing.currentValue = Math.max(0, existing.currentValue - amount);
          }
        }
      }
    });

    // Convert allocation to percentages
    const totalAllocation = allocation.equity + allocation.debt + allocation.hybrid + allocation.others;
    const portfolioAllocation: PortfolioAllocation = {
      equity: totalAllocation > 0 ? (allocation.equity / totalAllocation) * 100 : 0,
      debt: totalAllocation > 0 ? (allocation.debt / totalAllocation) * 100 : 0,
      hybrid: totalAllocation > 0 ? (allocation.hybrid / totalAllocation) * 100 : 0,
      others: totalAllocation > 0 ? (allocation.others / totalAllocation) * 100 : 0,
    };

    // Calculate gain/loss (simplified - use client's current_value if available)
    const clientCurrentValue = client.currentValue || client.current_value || totalValue;
    const totalGainLoss = clientCurrentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    const holdings = Array.from(holdingsMap.values()).filter(h => h.units > 0);

    return {
      success: true,
      data: {
        totalValue: clientCurrentValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercent,
        allocation: portfolioAllocation,
        holdings: includeHoldings ? holdings : [],
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Get portfolio error:', error);
    return {
      success: false,
      message: 'Failed to fetch portfolio',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Get portfolio impact preview for an order
 */
export async function getImpactPreview(
  clientId: number,
  order: CartItem[]
): Promise<APIResponse<PortfolioImpact>> {
  try {
    // Get current portfolio
    const portfolioResponse = await getPortfolio(clientId, false);
    if (!portfolioResponse.success || !portfolioResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch current portfolio',
        errors: portfolioResponse.errors || ['Unknown error'],
      };
    }

    const currentPortfolio = portfolioResponse.data;
    const beforeAllocation = currentPortfolio.allocation;

    // Calculate new allocation after order
    const orderAllocation: PortfolioAllocation = {
      equity: 0,
      debt: 0,
      hybrid: 0,
      others: 0,
    };

    let totalOrderAmount = 0;

    // Process each cart item
    for (const item of order) {
      const transactionType = (item.transactionType || '').toLowerCase();
      const amount = item.amount || 0;

      if (transactionType === 'purchase' || transactionType === 'buy') {
        totalOrderAmount += amount;
        
        // Get product category
        const productCategory = item.category || item.product?.category || '';
        const allocCategory = mapCategoryToAllocation(productCategory);
        orderAllocation[allocCategory] += amount;
      } else if (transactionType === 'redemption' || transactionType === 'sell') {
        totalOrderAmount -= amount;
        
        const productCategory = item.category || item.product?.category || '';
        const allocCategory = mapCategoryToAllocation(productCategory);
        orderAllocation[allocCategory] = Math.max(0, orderAllocation[allocCategory] - amount);
      }
    }

    // Calculate new total value
    const newTotalValue = currentPortfolio.totalValue + totalOrderAmount;
    const totalAllocation = currentPortfolio.totalValue + totalOrderAmount;

    // Calculate after allocation
    const afterAllocation: PortfolioAllocation = {
      equity: totalAllocation > 0
        ? ((beforeAllocation.equity * currentPortfolio.totalValue / 100) + orderAllocation.equity) / totalAllocation * 100
        : beforeAllocation.equity,
      debt: totalAllocation > 0
        ? ((beforeAllocation.debt * currentPortfolio.totalValue / 100) + orderAllocation.debt) / totalAllocation * 100
        : beforeAllocation.debt,
      hybrid: totalAllocation > 0
        ? ((beforeAllocation.hybrid * currentPortfolio.totalValue / 100) + orderAllocation.hybrid) / totalAllocation * 100
        : beforeAllocation.hybrid,
      others: totalAllocation > 0
        ? ((beforeAllocation.others * currentPortfolio.totalValue / 100) + orderAllocation.others) / totalAllocation * 100
        : beforeAllocation.others,
    };

    // Calculate changes
    const changes: AllocationChange[] = [
      {
        category: 'equity',
        change: afterAllocation.equity - beforeAllocation.equity,
        changePercent: beforeAllocation.equity > 0
          ? ((afterAllocation.equity - beforeAllocation.equity) / beforeAllocation.equity) * 100
          : 0,
        direction: afterAllocation.equity > beforeAllocation.equity ? 'increase' : 'decrease',
      },
      {
        category: 'debt',
        change: afterAllocation.debt - beforeAllocation.debt,
        changePercent: beforeAllocation.debt > 0
          ? ((afterAllocation.debt - beforeAllocation.debt) / beforeAllocation.debt) * 100
          : 0,
        direction: afterAllocation.debt > beforeAllocation.debt ? 'increase' : 'decrease',
      },
      {
        category: 'hybrid',
        change: afterAllocation.hybrid - beforeAllocation.hybrid,
        changePercent: beforeAllocation.hybrid > 0
          ? ((afterAllocation.hybrid - beforeAllocation.hybrid) / beforeAllocation.hybrid) * 100
          : 0,
        direction: afterAllocation.hybrid > beforeAllocation.hybrid ? 'increase' : 'decrease',
      },
      {
        category: 'others',
        change: afterAllocation.others - beforeAllocation.others,
        changePercent: beforeAllocation.others > 0
          ? ((afterAllocation.others - beforeAllocation.others) / beforeAllocation.others) * 100
          : 0,
        direction: afterAllocation.others > beforeAllocation.others ? 'increase' : 'decrease',
      },
    ];

    return {
      success: true,
      data: {
        beforeAllocation,
        afterAllocation,
        changes,
        totalValueChange: totalOrderAmount,
      },
    };
  } catch (error: any) {
    console.error('Get impact preview error:', error);
    return {
      success: false,
      message: 'Failed to calculate impact preview',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Get allocation gaps based on target allocation
 */
export async function getAllocationGaps(
  clientId: number,
  targetAllocation?: TargetAllocation
): Promise<APIResponse<AllocationGap[]>> {
  try {
    // Get current portfolio
    const portfolioResponse = await getPortfolio(clientId, false);
    if (!portfolioResponse.success || !portfolioResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch current portfolio',
        errors: portfolioResponse.errors || ['Unknown error'],
      };
    }

    const currentAllocation = portfolioResponse.data.allocation;

    // Get target allocation from client profile or use default
    let target: TargetAllocation;
    if (targetAllocation) {
      target = targetAllocation;
    } else {
      // Get client risk profile to determine target allocation
      let client: any;
      if (db && typeof db.select === 'function') {
        const clientRows = await db.select().from(clients).where(eq(clients.id, clientId));
        client = Array.isArray(clientRows) && clientRows.length > 0 ? clientRows[0] : null;
      } else {
        const { data: clientRow, error: clientErr } = await supabaseServer
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle();
        if (clientErr) throw clientErr;
        client = clientRow;
      }

      const riskProfile = (client?.riskProfile || client?.risk_profile || 'moderate').toLowerCase();
      
      // Default target allocations based on risk profile
      if (riskProfile === 'conservative' || riskProfile === 'very conservative') {
        target = { equity: 35, debt: 40, hybrid: 20, others: 5 };
      } else if (riskProfile === 'moderate') {
        target = { equity: 50, debt: 30, hybrid: 15, others: 5 };
      } else if (riskProfile === 'moderately aggressive') {
        target = { equity: 65, debt: 20, hybrid: 10, others: 5 };
      } else if (riskProfile === 'aggressive' || riskProfile === 'very aggressive') {
        target = { equity: 75, debt: 15, hybrid: 5, others: 5 };
      } else {
        target = { equity: 50, debt: 30, hybrid: 15, others: 5 };
      }
    }

    // Calculate gaps
    const gaps: AllocationGap[] = [
      {
        category: 'equity',
        current: currentAllocation.equity,
        target: target.equity,
        gap: target.equity - currentAllocation.equity,
        recommendation: target.equity > currentAllocation.equity
          ? `Increase equity allocation by ${(target.equity - currentAllocation.equity).toFixed(1)}%`
          : `Reduce equity allocation by ${(currentAllocation.equity - target.equity).toFixed(1)}%`,
        priority: Math.abs(target.equity - currentAllocation.equity) > 10 ? 'High' : 
                 Math.abs(target.equity - currentAllocation.equity) > 5 ? 'Medium' : 'Low',
      },
      {
        category: 'debt',
        current: currentAllocation.debt,
        target: target.debt,
        gap: target.debt - currentAllocation.debt,
        recommendation: target.debt > currentAllocation.debt
          ? `Increase debt allocation by ${(target.debt - currentAllocation.debt).toFixed(1)}%`
          : `Reduce debt allocation by ${(currentAllocation.debt - target.debt).toFixed(1)}%`,
        priority: Math.abs(target.debt - currentAllocation.debt) > 10 ? 'High' : 
                 Math.abs(target.debt - currentAllocation.debt) > 5 ? 'Medium' : 'Low',
      },
      {
        category: 'hybrid',
        current: currentAllocation.hybrid,
        target: target.hybrid,
        gap: target.hybrid - currentAllocation.hybrid,
        recommendation: target.hybrid > currentAllocation.hybrid
          ? `Increase hybrid allocation by ${(target.hybrid - currentAllocation.hybrid).toFixed(1)}%`
          : `Reduce hybrid allocation by ${(currentAllocation.hybrid - target.hybrid).toFixed(1)}%`,
        priority: Math.abs(target.hybrid - currentAllocation.hybrid) > 10 ? 'High' : 
                 Math.abs(target.hybrid - currentAllocation.hybrid) > 5 ? 'Medium' : 'Low',
      },
      {
        category: 'others',
        current: currentAllocation.others,
        target: target.others,
        gap: target.others - currentAllocation.others,
        recommendation: target.others > currentAllocation.others
          ? `Increase others allocation by ${(target.others - currentAllocation.others).toFixed(1)}%`
          : `Reduce others allocation by ${(currentAllocation.others - target.others).toFixed(1)}%`,
        priority: Math.abs(target.others - currentAllocation.others) > 10 ? 'High' : 
                 Math.abs(target.others - currentAllocation.others) > 5 ? 'Medium' : 'Low',
      },
    ];

    return {
      success: true,
      data: gaps,
    };
  } catch (error: any) {
    console.error('Get allocation gaps error:', error);
    return {
      success: false,
      message: 'Failed to calculate allocation gaps',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Get rebalancing suggestions
 */
export async function getRebalancingSuggestions(
  clientId: number,
  targetAllocation?: TargetAllocation
): Promise<APIResponse<RebalancingSuggestion[]>> {
  try {
    // Get allocation gaps
    const gapsResponse = await getAllocationGaps(clientId, targetAllocation);
    if (!gapsResponse.success || !gapsResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch allocation gaps',
        errors: gapsResponse.errors || ['Unknown error'],
      };
    }

    const gaps = gapsResponse.data;
    const portfolioResponse = await getPortfolio(clientId, true);
    if (!portfolioResponse.success || !portfolioResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch portfolio',
        errors: portfolioResponse.errors || ['Unknown error'],
      };
    }

    const portfolio = portfolioResponse.data;
    const suggestions: RebalancingSuggestion[] = [];

    // Generate suggestions based on gaps
    for (const gap of gaps) {
      if (Math.abs(gap.gap) < 1) continue; // Skip if gap is too small

      if (gap.gap > 0) {
        // Need to increase allocation
        suggestions.push({
          id: `buy-${gap.category}-${Date.now()}`,
          action: 'Buy',
          toScheme: `Increase ${gap.category} allocation`,
          toSchemeId: 0, // Would need product lookup
          amount: (portfolio.totalValue * Math.abs(gap.gap)) / 100,
          reason: gap.recommendation,
          priority: gap.priority,
          expectedImpact: `Will bring ${gap.category} allocation from ${gap.current.toFixed(1)}% to ${gap.target.toFixed(1)}%`,
        });
      } else {
        // Need to decrease allocation - suggest switch or redemption
        const holdingsInCategory = portfolio.holdings.filter(
          h => h.category === gap.category
        );

        if (holdingsInCategory.length > 0) {
          const holding = holdingsInCategory[0];
          const amountToReduce = (portfolio.totalValue * Math.abs(gap.gap)) / 100;

          // Find a category that needs increase
          const targetGap = gaps.find(g => g.gap > 0 && g.category !== gap.category);
          if (targetGap) {
            suggestions.push({
              id: `switch-${gap.category}-${targetGap.category}-${Date.now()}`,
              action: 'Switch',
              fromScheme: holding.schemeName,
              fromSchemeId: holding.productId,
              toScheme: `Increase ${targetGap.category} allocation`,
              toSchemeId: 0,
              amount: amountToReduce,
              reason: `Switch from ${gap.category} to ${targetGap.category} to rebalance portfolio`,
              priority: gap.priority,
              expectedImpact: `Will reduce ${gap.category} by ${Math.abs(gap.gap).toFixed(1)}% and increase ${targetGap.category} by ${targetGap.gap.toFixed(1)}%`,
            });
          } else {
            suggestions.push({
              id: `sell-${gap.category}-${Date.now()}`,
              action: 'Sell',
              fromScheme: holding.schemeName,
              fromSchemeId: holding.productId,
              toScheme: 'Cash',
              toSchemeId: 0,
              amount: amountToReduce,
              reason: `Reduce ${gap.category} allocation`,
              priority: gap.priority,
              expectedImpact: `Will reduce ${gap.category} allocation from ${gap.current.toFixed(1)}% to ${gap.target.toFixed(1)}%`,
            });
          }
        }
      }
    }

    return {
      success: true,
      data: suggestions.sort((a, b) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
    };
  } catch (error: any) {
    console.error('Get rebalancing suggestions error:', error);
    return {
      success: false,
      message: 'Failed to generate rebalancing suggestions',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Get client holdings
 */
export async function getHoldings(
  clientId: number,
  schemeId?: number
): Promise<APIResponse<Holding[]>> {
  try {
    const portfolioResponse = await getPortfolio(clientId, true);
    if (!portfolioResponse.success || !portfolioResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch holdings',
        errors: portfolioResponse.errors || ['Unknown error'],
      };
    }

    let holdings = portfolioResponse.data.holdings;

    // Filter by scheme if provided
    if (schemeId) {
      holdings = holdings.filter(h => h.productId === schemeId);
    }

    return {
      success: true,
      data: holdings,
    };
  } catch (error: any) {
    console.error('Get holdings error:', error);
    return {
      success: false,
      message: 'Failed to fetch holdings',
      errors: [error.message || 'Unknown error'],
    };
  }
}

