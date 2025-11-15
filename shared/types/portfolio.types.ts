/**
 * Foundation Layer - F1: Portfolio Types
 * Types for portfolio-aware ordering features
 */

export interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  allocation: PortfolioAllocation;
  holdings: Holding[];
  lastUpdated: string;
}

export interface PortfolioAllocation {
  equity: number;
  debt: number;
  hybrid: number;
  others: number;
}

export interface TargetAllocation {
  equity: number;
  debt: number;
  hybrid: number;
  others: number;
}

export interface AllocationGap {
  category: string;
  current: number;
  target: number;
  gap: number;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface PortfolioImpact {
  beforeAllocation: PortfolioAllocation;
  afterAllocation: PortfolioAllocation;
  changes: AllocationChange[];
  totalValueChange: number;
}

export interface AllocationChange {
  category: string;
  change: number;
  changePercent: number;
  direction: 'increase' | 'decrease';
}

export interface RebalancingSuggestion {
  id: string;
  action: 'Buy' | 'Sell' | 'Switch';
  fromScheme?: string;
  fromSchemeId?: number;
  toScheme: string;
  toSchemeId: number;
  amount: number;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
  expectedImpact: string;
}

export interface Holding {
  id: number;
  productId: number;
  schemeName: string;
  category: string;
  units: number;
  nav: number;
  currentValue: number;
  investedAmount: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: string;
  lastTransactionDate?: string;
}

export interface PortfolioPerformance {
  oneDay: number;
  oneWeek: number;
  oneMonth: number;
  threeMonths: number;
  sixMonths: number;
  oneYear: number;
  threeYears?: number;
  fiveYears?: number;
  sinceInception?: number;
}

export interface PortfolioDelta {
  id: number;
  clientName: string;
  deltaType: 'allocation-drift' | 'cash-drift' | 'performance' | 'risk';
  deltaValue: number;
  direction: 'up' | 'down';
  impact: 'critical' | 'high' | 'moderate' | 'low';
  summary: string;
  timeframe: string;
  assignedTo?: number;
  lastUpdated: string;
}

