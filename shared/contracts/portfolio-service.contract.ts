/**
 * Foundation Layer - F2: Portfolio Service Contract
 * Defines the interface contract for Portfolio Service
 */

import type { 
  PortfolioData,
  PortfolioImpact,
  RebalancingSuggestion,
  Holding,
  APIResponse 
} from '../types/portfolio.types';
import type { CartItem } from '../types/order-management.types';

export interface IPortfolioService {
  /**
   * Get current portfolio data
   */
  getPortfolio(clientId: number, includeHoldings?: boolean): Promise<APIResponse<PortfolioData>>;

  /**
   * Get portfolio impact preview for an order
   */
  getImpactPreview(clientId: number, order: CartItem[]): Promise<APIResponse<PortfolioImpact>>;

  /**
   * Get allocation gaps
   */
  getAllocationGaps(clientId: number, targetAllocation?: any): Promise<APIResponse<any[]>>;

  /**
   * Get rebalancing suggestions
   */
  getRebalancingSuggestions(clientId: number, targetAllocation?: any): Promise<APIResponse<RebalancingSuggestion[]>>;

  /**
   * Get client holdings
   */
  getHoldings(clientId: number, schemeId?: number): Promise<APIResponse<Holding[]>>;

  /**
   * Get portfolio performance
   */
  getPerformance(clientId: number, period?: string): Promise<APIResponse<any>>;
}

