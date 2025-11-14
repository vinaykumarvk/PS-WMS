/**
 * Foundation Layer - F2: Redemption Service Contract
 */

import type { APIResponse } from '../types/api.types';

export interface IRedemptionService {
  calculateRedemption(params: {
    schemeId: number;
    units?: number;
    amount?: number;
    redemptionType?: string;
  }): Promise<APIResponse<any>>;

  executeRedemption(params: {
    schemeId: number;
    units?: number;
    amount?: number;
    redemptionType: string;
    isFullRedemption?: boolean;
  }): Promise<APIResponse<any>>;

  executeInstantRedemption(params: {
    schemeId: number;
    amount: number;
  }): Promise<APIResponse<any>>;

  checkInstantRedemptionEligibility(params: {
    schemeId: number;
    amount: number;
  }): Promise<APIResponse<{
    eligible: boolean;
    maxAmount: number;
    availableAmount: number;
    reason?: string;
  }>>;

  getRedemptionHistory(clientId: number, filters?: any): Promise<APIResponse<any[]>>;
}

