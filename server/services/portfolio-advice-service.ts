import { getPortfolio, getRebalancingSuggestions } from './portfolio-analysis-service';
import type {
  PortfolioAdviceItem,
  PortfolioAdviceAction,
  PortfolioScenarioRequest,
  PortfolioScenarioResponse,
  PortfolioChartAllocation,
} from '@shared/types/portfolio.types';
import type { APIResponse } from '@shared/types/api.types';
import type { Holding, RebalancingSuggestion } from '@shared/types/portfolio.types';

function buildId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function summarizeRebalancingSuggestion(suggestion: RebalancingSuggestion): PortfolioAdviceItem {
  const actions: PortfolioAdviceAction[] = [
    {
      label: suggestion.action,
      description: suggestion.reason,
      amount: suggestion.amount,
      impact: suggestion.expectedImpact,
    },
  ];

  const direction = suggestion.action === 'Buy'
    ? `increase exposure to ${suggestion.toScheme}`
    : suggestion.action === 'Sell'
      ? `lighten ${suggestion.fromScheme}`
      : `switch part of ${suggestion.fromScheme}`;

  const summary = `Model recommends ${direction.toLowerCase()} worth ${formatCurrency(suggestion.amount)}.`;

  return {
    id: suggestion.id || buildId('rebalance'),
    category: 'rebalance',
    title: suggestion.action === 'Buy'
      ? 'Add to underweight allocation'
      : suggestion.action === 'Sell'
        ? 'Trim overweight holding'
        : 'Switch allocation to rebalance',
    summary,
    rationale: suggestion.expectedImpact,
    generatedAt: new Date().toISOString(),
    actions,
    metadata: {
      fromScheme: suggestion.fromScheme,
      toScheme: suggestion.toScheme,
      priority: suggestion.priority,
    },
  };
}

function pseudoReturnFromHolding(holding: Holding): number {
  const base = holding.productId || holding.id || 1;
  const normalized = Math.sin(base * 13.37) * 0.12; // Between roughly -12% and +12%
  return Math.round(normalized * 10000) / 100; // two decimal percent
}

function buildTaxLossAdvice(holdings: Holding[]): PortfolioAdviceItem {
  const opportunities = holdings
    .map((holding) => {
      const invested = holding.investedAmount || holding.currentValue || 0;
      const pseudoReturn = pseudoReturnFromHolding(holding);
      const estimatedCurrent = invested * (1 + pseudoReturn / 100);
      const lossValue = Math.max(0, invested - estimatedCurrent);

      return {
        holding,
        pseudoReturn,
        lossValue,
        estimatedCurrent,
      };
    })
    .filter((item) => item.lossValue > 0)
    .sort((a, b) => b.lossValue - a.lossValue);

  const actions: PortfolioAdviceAction[] = opportunities.slice(0, 2).map((candidate) => ({
    label: candidate.holding.schemeName,
    description: `Harvest approximately ${formatCurrency(candidate.lossValue)} by switching to a similar exposure.`,
    impact: `Estimated return: ${candidate.pseudoReturn.toFixed(2)}%`,
    amount: candidate.lossValue,
  }));

  const summary =
    opportunities.length > 0
      ? `Model spotted ${opportunities.length} positions trading below cost basis. Harvesting the top candidate could unlock approximately ${formatCurrency(opportunities[0].lossValue)} in losses.`
      : 'Model did not detect any significant unrealised losses. Maintain current positions for now.';

  return {
    id: buildId('tax-loss'),
    category: 'tax_loss',
    title: 'Tax-Loss Harvesting Opportunities',
    summary,
    rationale:
      opportunities.length > 0
        ? 'Realising targeted losses can offset capital gains without materially altering the allocation.'
        : 'No holdings are materially underwater based on synthetic performance estimates.',
    generatedAt: new Date().toISOString(),
    actions: actions.length > 0
      ? actions
      : [{
          label: 'Monitor positions',
          description: 'Re-run analysis closer to financial year-end or after market volatility spikes.',
        }],
    metadata: {
      analysedHoldings: holdings.length,
    },
  };
}

export async function generatePortfolioAdvice(clientId: number): Promise<APIResponse<PortfolioAdviceItem[]>> {
  try {
    const portfolioResponse = await getPortfolio(clientId, true);
    if (!portfolioResponse.success || !portfolioResponse.data) {
      return {
        success: false,
        message: 'Failed to fetch portfolio',
        errors: portfolioResponse.errors || ['Unknown error'],
      };
    }

    const holdings = portfolioResponse.data.holdings || [];

    const rebalancingResponse = await getRebalancingSuggestions(clientId);
    const rebalancingItems =
      rebalancingResponse.success && Array.isArray(rebalancingResponse.data)
        ? rebalancingResponse.data.map(summarizeRebalancingSuggestion)
        : [];

    const taxLossItem = buildTaxLossAdvice(holdings);

    return {
      success: true,
      data: [...rebalancingItems, taxLossItem],
    };
  } catch (error: any) {
    console.error('generatePortfolioAdvice error:', error);
    return {
      success: false,
      message: 'Failed to generate portfolio advice',
      errors: [error.message || 'Unknown error'],
    };
  }
}

const ALLOCATION_KEYWORDS: Record<string, string> = {
  equity: 'equity',
  equities: 'equity',
  stocks: 'equity',
  stock: 'equity',
  debt: 'debt',
  bonds: 'debt',
  bond: 'debt',
  fixed: 'debt',
  income: 'debt',
  hybrid: 'hybrid',
  balanced: 'hybrid',
  multi: 'hybrid',
  cash: 'cash',
  liquidity: 'cash',
  gold: 'gold',
  commodities: 'gold',
  commodity: 'gold',
};

function normaliseKey(allocation: PortfolioChartAllocation, key: string): string | undefined {
  const lowerKey = key.toLowerCase();
  const mapped = ALLOCATION_KEYWORDS[lowerKey];
  if (mapped) {
    key = mapped;
  }

  const keys = Object.keys(allocation);
  return keys.find((candidate) => candidate.toLowerCase() === key.toLowerCase())
    || keys.find((candidate) => candidate.toLowerCase().includes(key.toLowerCase()));
}

function cloneAllocation(allocation: PortfolioChartAllocation): PortfolioChartAllocation {
  const clone: PortfolioChartAllocation = {};
  for (const [key, value] of Object.entries(allocation)) {
    clone[key] = Number.isFinite(value) ? value : 0;
  }
  return clone;
}

function adjustAllocation(
  allocation: PortfolioChartAllocation,
  key: string,
  delta: number,
) {
  const matchedKey = normaliseKey(allocation, key);
  if (!matchedKey) return allocation;

  const updated = { ...allocation };
  updated[matchedKey] = Math.max(0, (updated[matchedKey] ?? 0) + delta);
  return updated;
}

function rebalanceRemainder(allocation: PortfolioChartAllocation): PortfolioChartAllocation {
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  if (total === 100 || total === 0) {
    return allocation;
  }

  const updated = { ...allocation };
  const difference = 100 - total;
  const anchorKey = Object.entries(updated).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (anchorKey) {
    updated[anchorKey] = Math.max(0, updated[anchorKey] + difference);
  }

  return updated;
}

function parseShiftIntents(prompt: string) {
  const intents: Array<{ from?: string; to?: string; amount: number; type: 'shift' | 'increase' | 'decrease'; }>
    = [];

  const shiftRegex = /(shift|move|reallocate|transfer)\s+(\d+(?:\.\d+)?)%\s+from\s+([a-zA-Z ]+)\s+to\s+([a-zA-Z ]+)/gi;
  let shiftMatch;
  while ((shiftMatch = shiftRegex.exec(prompt)) !== null) {
    intents.push({
      type: 'shift',
      amount: parseFloat(shiftMatch[2]),
      from: shiftMatch[3].trim(),
      to: shiftMatch[4].trim(),
    });
  }

  const increaseRegex = /(increase|raise|add)\s+([a-zA-Z ]+?)\s+(?:allocation\s+)?by\s+(\d+(?:\.\d+)?)%/gi;
  let increaseMatch;
  while ((increaseMatch = increaseRegex.exec(prompt)) !== null) {
    intents.push({
      type: 'increase',
      amount: parseFloat(increaseMatch[3]),
      to: increaseMatch[2].trim(),
    });
  }

  const decreaseRegex = /(reduce|decrease|trim|cut)\s+([a-zA-Z ]+?)\s+(?:allocation\s+)?by\s+(\d+(?:\.\d+)?)%/gi;
  let decreaseMatch;
  while ((decreaseMatch = decreaseRegex.exec(prompt)) !== null) {
    intents.push({
      type: 'decrease',
      amount: parseFloat(decreaseMatch[3]),
      from: decreaseMatch[2].trim(),
    });
  }

  return intents;
}

export function runScenarioAnalysis(payload: PortfolioScenarioRequest): PortfolioScenarioResponse {
  const baseAllocation = cloneAllocation(payload.baseAllocation);
  let allocation = { ...baseAllocation };
  const insights: string[] = [];
  const detectedIntents: string[] = [];
  let expectedReturnDelta = 0;
  let riskTendency = 0;

  const intents = parseShiftIntents(payload.prompt);

  intents.forEach((intent) => {
    detectedIntents.push(intent.type);

    if (intent.type === 'shift' && intent.from && intent.to) {
      const fromKey = normaliseKey(allocation, intent.from);
      const toKey = normaliseKey(allocation, intent.to);
      if (!fromKey || !toKey) return;

      allocation = adjustAllocation(allocation, fromKey, -intent.amount);
      allocation = adjustAllocation(allocation, toKey, intent.amount);

      insights.push(`Shifted ${intent.amount}% from ${fromKey} to ${toKey}.`);

      if (toKey.toLowerCase().includes('equity')) {
        expectedReturnDelta += intent.amount * 0.04;
        riskTendency += intent.amount;
      } else if (toKey.toLowerCase().includes('debt') || toKey.toLowerCase().includes('cash')) {
        expectedReturnDelta -= intent.amount * 0.02;
        riskTendency -= intent.amount;
      }
    }

    if (intent.type === 'increase' && intent.to) {
      const toKey = normaliseKey(allocation, intent.to);
      if (!toKey) return;

      const largestKey = Object.entries(allocation)
        .filter(([key]) => key !== toKey)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (largestKey) {
        allocation = adjustAllocation(allocation, largestKey, -intent.amount);
      }
      allocation = adjustAllocation(allocation, toKey, intent.amount);
      insights.push(`Increased ${toKey} by ${intent.amount}%.`);

      if (toKey.toLowerCase().includes('equity')) {
        expectedReturnDelta += intent.amount * 0.04;
        riskTendency += intent.amount;
      } else if (toKey.toLowerCase().includes('debt') || toKey.toLowerCase().includes('cash')) {
        expectedReturnDelta -= intent.amount * 0.02;
        riskTendency -= intent.amount;
      }
    }

    if (intent.type === 'decrease' && intent.from) {
      const fromKey = normaliseKey(allocation, intent.from);
      if (!fromKey) return;

      allocation = adjustAllocation(allocation, fromKey, -intent.amount);
      insights.push(`Reduced ${fromKey} by ${intent.amount}%.`);

      if (fromKey.toLowerCase().includes('equity')) {
        expectedReturnDelta -= intent.amount * 0.03;
        riskTendency -= intent.amount;
      } else if (fromKey.toLowerCase().includes('debt')) {
        expectedReturnDelta += intent.amount * 0.015;
        riskTendency += intent.amount * 0.5;
      }
    }
  });

  allocation = rebalanceRemainder(allocation);

  if (insights.length === 0) {
    insights.push('No specific allocation shifts detected. Scenario preserves current mix.');
  }

  const riskShift: 'higher' | 'lower' | 'neutral' = riskTendency > 3
    ? 'higher'
    : riskTendency < -3
      ? 'lower'
      : 'neutral';

  const summary = insights.length > 0
    ? insights[0]
    : 'No allocation changes applied.';

  return {
    prompt: payload.prompt,
    summary,
    adjustments: {
      allocation,
      expectedReturnDelta: Math.round(expectedReturnDelta * 100) / 100,
      riskShift,
      confidence: intents.length > 0 ? 0.7 : 0.4,
    },
    insights,
    detectedIntents,
  };
}
