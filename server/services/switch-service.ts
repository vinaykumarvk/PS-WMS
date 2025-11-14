/**
 * Switch Service
 * Module D: Advanced Switch Features
 * Handles switch calculations, executions, history, and recommendations
 */

import type {
  SwitchCalculation,
  PartialSwitch,
  MultiSchemeSwitch,
  SwitchRecommendation,
} from '@shared/types/order-management.types';
import type { APIResponse } from '@shared/types/api.types';
import type { Holding } from '@shared/types/portfolio.types';

// Mock storage for switch history (in production, this would be a database table)
const switchHistoryStorage: Map<number, any[]> = new Map();

/**
 * Calculate switch tax implications and costs
 */
export async function calculateSwitch(params: {
  sourceSchemeId: number;
  targetSchemeId: number;
  amount?: number;
  units?: number;
}): Promise<APIResponse<SwitchCalculation>> {
  try {
    const { sourceSchemeId, targetSchemeId, amount, units } = params;

    if (!sourceSchemeId || !targetSchemeId) {
      return {
        success: false,
        message: 'Source and target scheme IDs are required',
        errors: ['Source and target scheme IDs are required'],
      };
    }

    if (!amount && !units) {
      return {
        success: false,
        message: 'Either amount or units must be provided',
        errors: ['Either amount or units must be provided'],
      };
    }

    // Mock calculation - in production, this would:
    // 1. Fetch source scheme NAV and holdings
    // 2. Fetch target scheme NAV
    // 3. Calculate units if amount provided, or amount if units provided
    // 4. Calculate exit load based on scheme rules
    // 5. Calculate tax implications based on holding period and gains
    // 6. Calculate net amount after charges

    const sourceNAV = 25.5; // Mock NAV
    const targetNAV = 28.3; // Mock NAV
    const exitLoadPercent = 1.0; // 1% exit load

    let switchAmount: number;
    let sourceUnits: number;
    let targetUnits: number;

    if (amount) {
      switchAmount = amount;
      sourceUnits = amount / sourceNAV;
      const exitLoadAmount = (amount * exitLoadPercent) / 100;
      const netAmount = amount - exitLoadAmount;
      targetUnits = netAmount / targetNAV;
    } else if (units) {
      sourceUnits = units;
      switchAmount = units * sourceNAV;
      const exitLoadAmount = (switchAmount * exitLoadPercent) / 100;
      const netAmount = switchAmount - exitLoadAmount;
      targetUnits = netAmount / targetNAV;
    } else {
      throw new Error('Invalid parameters');
    }

    const exitLoadAmount = (switchAmount * exitLoadPercent) / 100;
    const netAmount = switchAmount - exitLoadAmount;

    // Mock tax calculations
    // In production, this would:
    // 1. Check holding period (short-term < 1 year, long-term >= 1 year)
    // 2. Calculate capital gains
    // 3. Apply appropriate tax rates
    const holdingPeriod = 18; // months - mock data
    const purchasePrice = sourceNAV * 0.9; // Mock purchase price
    const capitalGain = switchAmount - (sourceUnits * purchasePrice);
    
    const taxImplications = {
      shortTermGain: holdingPeriod < 12 ? capitalGain : 0,
      longTermGain: holdingPeriod >= 12 ? capitalGain : 0,
      taxAmount: holdingPeriod < 12 
        ? capitalGain * 0.15 // 15% STCG tax
        : capitalGain > 100000 
          ? (capitalGain - 100000) * 0.10 // 10% LTCG tax above 1L exemption
          : 0,
    };

    const calculation: SwitchCalculation = {
      sourceScheme: `Scheme ${sourceSchemeId}`,
      targetScheme: `Scheme ${targetSchemeId}`,
      sourceUnits,
      sourceNAV,
      targetNAV,
      switchAmount,
      targetUnits,
      exitLoad: exitLoadPercent,
      exitLoadAmount,
      netAmount,
      taxImplications,
    };

    return {
      success: true,
      message: 'Switch calculation completed',
      data: calculation,
    };
  } catch (error: any) {
    console.error('Calculate switch error:', error);
    return {
      success: false,
      message: 'Failed to calculate switch',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Execute partial switch
 */
export async function executePartialSwitch(params: PartialSwitch): Promise<APIResponse<any>> {
  try {
    const { sourceSchemeId, targetSchemeId, amount, units } = params;

    if (!amount && !units) {
      return {
        success: false,
        message: 'Either amount or units must be provided',
        errors: ['Either amount or units must be provided'],
      };
    }

    // Mock execution - in production, this would:
    // 1. Validate holdings and available balance
    // 2. Calculate switch details
    // 3. Create switch order/transaction record
    // 4. Update holdings
    // 5. Return order confirmation

    const switchId = Date.now(); // Mock switch ID
    const switchDate = new Date().toISOString();

    // Store in mock history
    const historyEntry = {
      id: switchId,
      sourceSchemeId,
      targetSchemeId,
      amount: amount || 0,
      units: units || 0,
      switchDate,
      status: 'Pending',
      type: 'Partial',
    };

    // In production, this would be stored in a database
    const clientId = 1; // Mock client ID - should come from auth context
    if (!switchHistoryStorage.has(clientId)) {
      switchHistoryStorage.set(clientId, []);
    }
    switchHistoryStorage.get(clientId)!.push(historyEntry);

    return {
      success: true,
      message: 'Partial switch executed successfully',
      data: {
        switchId,
        switchDate,
        status: 'Pending',
      },
    };
  } catch (error: any) {
    console.error('Execute partial switch error:', error);
    return {
      success: false,
      message: 'Failed to execute partial switch',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Execute multi-scheme switch
 */
export async function executeMultiSchemeSwitch(params: MultiSchemeSwitch): Promise<APIResponse<any>> {
  try {
    const { sourceSchemeId, targets } = params;

    if (!targets || targets.length === 0) {
      return {
        success: false,
        message: 'At least one target scheme must be provided',
        errors: ['At least one target scheme must be provided'],
      };
    }

    const totalAmount = targets.reduce((sum, t) => sum + t.amount, 0);
    if (totalAmount <= 0) {
      return {
        success: false,
        message: 'Total switch amount must be greater than zero',
        errors: ['Total switch amount must be greater than zero'],
      };
    }

    // Mock execution - in production, this would:
    // 1. Validate holdings and available balance
    // 2. Calculate switch details for each target
    // 3. Create switch order/transaction records
    // 4. Update holdings
    // 5. Return order confirmation

    const switchId = Date.now(); // Mock switch ID
    const switchDate = new Date().toISOString();

    // Store in mock history
    const historyEntry = {
      id: switchId,
      sourceSchemeId,
      targets: targets.map(t => ({
        schemeId: t.schemeId,
        amount: t.amount,
        percentage: t.percentage,
      })),
      totalAmount,
      switchDate,
      status: 'Pending',
      type: 'Multi-Scheme',
    };

    // In production, this would be stored in a database
    const clientId = 1; // Mock client ID - should come from auth context
    if (!switchHistoryStorage.has(clientId)) {
      switchHistoryStorage.set(clientId, []);
    }
    switchHistoryStorage.get(clientId)!.push(historyEntry);

    return {
      success: true,
      message: 'Multi-scheme switch executed successfully',
      data: {
        switchId,
        switchDate,
        status: 'Pending',
        targets: targets.length,
      },
    };
  } catch (error: any) {
    console.error('Execute multi-scheme switch error:', error);
    return {
      success: false,
      message: 'Failed to execute multi-scheme switch',
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Get switch history for a client
 */
export async function getSwitchHistory(
  clientId: number,
  filters?: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<APIResponse<any[]>> {
  try {
    // Get history from mock storage
    let history = switchHistoryStorage.get(clientId) || [];

    // Apply filters
    if (filters) {
      if (filters.status) {
        history = history.filter((h: any) => h.status === filters.status);
      }
      if (filters.type) {
        history = history.filter((h: any) => h.type === filters.type);
      }
      if (filters.dateFrom) {
        history = history.filter((h: any) => h.switchDate >= filters.dateFrom);
      }
      if (filters.dateTo) {
        history = history.filter((h: any) => h.switchDate <= filters.dateTo);
      }
    }

    // Format history entries
    const formattedHistory = history.map((entry: any) => ({
      id: entry.id,
      sourceScheme: `Scheme ${entry.sourceSchemeId}`,
      targetSchemes: entry.targets
        ? entry.targets.map((t: any) => `Scheme ${t.schemeId}`)
        : [`Scheme ${entry.targetSchemeId}`],
      amount: entry.amount || entry.totalAmount || 0,
      units: entry.units,
      switchDate: entry.switchDate,
      status: entry.status,
      type: entry.type,
      exitLoad: 1.0, // Mock
      exitLoadAmount: (entry.amount || entry.totalAmount || 0) * 0.01,
      netAmount: (entry.amount || entry.totalAmount || 0) * 0.99,
    }));

    // Sort by date descending
    formattedHistory.sort((a: any, b: any) => 
      new Date(b.switchDate).getTime() - new Date(a.switchDate).getTime()
    );

    return {
      success: true,
      message: 'Switch history retrieved successfully',
      data: formattedHistory,
    };
  } catch (error: any) {
    console.error('Get switch history error:', error);
    return {
      success: false,
      message: 'Failed to fetch switch history',
      errors: [error.message || 'Unknown error'],
      data: [],
    };
  }
}

/**
 * Get switch recommendations for a client
 */
export async function getSwitchRecommendations(clientId: number): Promise<APIResponse<SwitchRecommendation[]>> {
  try {
    // Mock recommendations - in production, this would:
    // 1. Analyze client portfolio
    // 2. Compare scheme performance
    // 3. Identify underperforming schemes
    // 4. Suggest better alternatives based on:
    //    - Risk profile match
    //    - Performance trends
    //    - Portfolio diversification
    //    - Tax optimization opportunities

    const mockRecommendations: SwitchRecommendation[] = [
      {
        fromScheme: 'Large Cap Equity Fund',
        toScheme: 'Multi Cap Equity Fund',
        reason: 'Multi-cap funds have shown better performance over the past 2 years and provide better diversification',
        expectedBenefit: 'Potential 2-3% higher returns with similar risk profile',
        riskLevel: 'Low',
      },
      {
        fromScheme: 'Debt Fund A',
        toScheme: 'Debt Fund B',
        reason: 'Lower expense ratio and better credit quality in Debt Fund B',
        expectedBenefit: 'Lower costs and potentially better risk-adjusted returns',
        riskLevel: 'Low',
      },
      {
        fromScheme: 'Mid Cap Fund',
        toScheme: 'Large Cap Fund',
        reason: 'Consider reducing mid-cap exposure for more stability as you approach retirement',
        expectedBenefit: 'Lower volatility while maintaining equity exposure',
        riskLevel: 'Medium',
      },
    ];

    return {
      success: true,
      message: 'Switch recommendations retrieved successfully',
      data: mockRecommendations,
    };
  } catch (error: any) {
    console.error('Get switch recommendations error:', error);
    return {
      success: false,
      message: 'Failed to fetch switch recommendations',
      errors: [error.message || 'Unknown error'],
      data: [],
    };
  }
}

