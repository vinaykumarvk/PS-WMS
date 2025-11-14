/**
 * Foundation Layer - F2: Switch Service Contract
 */

import type { APIResponse } from '../types/api.types';

export interface ISwitchService {
  calculateSwitch(params: {
    sourceSchemeId: number;
    targetSchemeId: number;
    amount?: number;
    units?: number;
  }): Promise<APIResponse<any>>;

  executeSwitch(params: {
    sourceSchemeId: number;
    targetSchemeId: number;
    amount?: number;
    units?: number;
    isFullSwitch?: boolean;
  }): Promise<APIResponse<any>>;

  executePartialSwitch(params: {
    sourceSchemeId: number;
    targetSchemeId: number;
    amount: number;
  }): Promise<APIResponse<any>>;

  executeMultiSchemeSwitch(params: {
    sourceSchemeId: number;
    targets: Array<{
      schemeId: number;
      amount: number;
      percentage?: number;
    }>;
  }): Promise<APIResponse<any>>;

  getSwitchHistory(clientId: number, filters?: any): Promise<APIResponse<any[]>>;

  getSwitchRecommendations(clientId: number): Promise<APIResponse<any[]>>;
}

