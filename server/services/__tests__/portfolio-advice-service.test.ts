import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIResponse } from '@shared/types/api.types';
import type { PortfolioData, Holding, PortfolioChartAllocation } from '@shared/types/portfolio.types';

type PortfolioResponse = APIResponse<PortfolioData>;

describe('portfolio-advice-service', () => {
  const mockHoldings: Holding[] = [
    {
      id: 1,
      productId: 101,
      schemeName: 'Alpha Equity Fund',
      category: 'equity',
      units: 100,
      nav: 100,
      currentValue: 10000,
      investedAmount: 11000,
      gainLoss: -1000,
      gainLossPercent: -9.09,
      purchaseDate: new Date().toISOString(),
    },
    {
      id: 2,
      productId: 202,
      schemeName: 'Secure Debt Fund',
      category: 'debt',
      units: 200,
      nav: 50,
      currentValue: 10000,
      investedAmount: 9000,
      gainLoss: 1000,
      gainLossPercent: 11.11,
      purchaseDate: new Date().toISOString(),
    },
  ];

  const portfolioResponse: PortfolioResponse = {
    success: true,
    data: {
      totalValue: 20000,
      totalInvested: 20000,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      allocation: { equity: 60, debt: 30, hybrid: 10, others: 0 },
      holdings: mockHoldings,
      lastUpdated: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('generates advice with rebalancing and tax loss items', async () => {
    vi.doMock('../portfolio-analysis-service', () => ({
      getPortfolio: vi.fn().mockResolvedValue(portfolioResponse),
      getRebalancingSuggestions: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'rebalance-1',
            action: 'Buy',
            toScheme: 'Increase debt allocation',
            toSchemeId: 2,
            amount: 5000,
            reason: 'Portfolio is overweight in equity.',
            priority: 'High',
            expectedImpact: 'Will rebalance debt exposure.',
          },
        ],
      }),
    }));

    const { generatePortfolioAdvice } = await import('../portfolio-advice-service');
    const result = await generatePortfolioAdvice(1);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.some((item) => item.category === 'rebalance')).toBe(true);
    expect(result.data?.some((item) => item.category === 'tax_loss')).toBe(true);
  });

  it('interprets scenario prompts and adjusts allocation', async () => {
    const baseAllocation: PortfolioChartAllocation = { Equity: 60, Debt: 30, Cash: 10 };
    const prompt = 'Shift 10% from Equity to Debt and increase Cash by 5%';

    const { runScenarioAnalysis } = await import('../portfolio-advice-service');

    const response = runScenarioAnalysis({
      clientId: 1,
      prompt,
      baseAllocation,
    });

    expect(response.adjustments.allocation).toBeDefined();
    expect(response.insights.length).toBeGreaterThan(0);
    expect(response.detectedIntents.length).toBeGreaterThan(0);
    const { allocation } = response.adjustments;
    expect(allocation?.Debt).toBeGreaterThan(baseAllocation.Debt);
    expect(allocation?.Equity).toBeLessThan(baseAllocation.Equity);
  });
});
