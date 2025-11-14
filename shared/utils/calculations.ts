/**
 * Foundation Layer - F3: Calculation Utilities
 * Common calculation functions used across all modules
 */

/**
 * Calculate units from amount and NAV
 */
export function calculateUnits(amount: number, nav: number): number {
  if (nav <= 0) return 0;
  return amount / nav;
}

/**
 * Calculate amount from units and NAV
 */
export function calculateAmount(units: number, nav: number): number {
  return units * nav;
}

/**
 * Calculate gain/loss
 */
export function calculateGainLoss(currentValue: number, investedAmount: number): {
  absolute: number;
  percentage: number;
} {
  const absolute = currentValue - investedAmount;
  const percentage = investedAmount > 0 ? (absolute / investedAmount) * 100 : 0;
  
  return {
    absolute,
    percentage,
  };
}

/**
 * Calculate portfolio allocation percentage
 */
export function calculateAllocationPercentage(categoryValue: number, totalValue: number): number {
  if (totalValue === 0) return 0;
  return (categoryValue / totalValue) * 100;
}

/**
 * Calculate SIP returns (simplified)
 */
export function calculateSIPReturns(
  monthlyAmount: number,
  durationMonths: number,
  annualReturnPercent: number
): {
  totalInvested: number;
  expectedValue: number;
  estimatedReturns: number;
  returnPercentage: number;
} {
  const totalInvested = monthlyAmount * durationMonths;
  const monthlyReturn = annualReturnPercent / 12 / 100;
  
  // Future Value of Annuity formula: FV = P * (((1 + r)^n - 1) / r)
  const expectedValue = monthlyAmount * 
    ((Math.pow(1 + monthlyReturn, durationMonths) - 1) / monthlyReturn);
  
  const estimatedReturns = expectedValue - totalInvested;
  const returnPercentage = (estimatedReturns / totalInvested) * 100;
  
  return {
    totalInvested,
    expectedValue,
    estimatedReturns,
    returnPercentage,
  };
}

/**
 * Calculate exit load
 */
export function calculateExitLoad(
  amount: number,
  exitLoadPercent: number,
  holdingPeriodDays: number,
  exitLoadPeriodDays: number = 365
): number {
  if (holdingPeriodDays >= exitLoadPeriodDays) {
    return 0;
  }
  
  return (amount * exitLoadPercent) / 100;
}

/**
 * Calculate net redemption amount
 */
export function calculateNetRedemptionAmount(
  grossAmount: number,
  exitLoad: number,
  tds?: number
): number {
  return grossAmount - exitLoad - (tds || 0);
}

/**
 * Calculate switch amount after exit load
 */
export function calculateSwitchAmount(
  sourceUnits: number,
  sourceNAV: number,
  exitLoadPercent: number,
  holdingPeriodDays: number
): {
  grossAmount: number;
  exitLoad: number;
  netAmount: number;
} {
  const grossAmount = sourceUnits * sourceNAV;
  const exitLoad = calculateExitLoad(grossAmount, exitLoadPercent, holdingPeriodDays);
  const netAmount = grossAmount - exitLoad;
  
  return {
    grossAmount,
    exitLoad,
    netAmount,
  };
}

/**
 * Calculate target units from switch amount
 */
export function calculateTargetUnits(
  switchAmount: number,
  targetNAV: number
): number {
  if (targetNAV <= 0) return 0;
  return switchAmount / targetNAV;
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Round units (typically 4 decimal places for MF)
 */
export function roundUnits(units: number, decimals: number = 4): number {
  return roundToDecimals(units, decimals);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate allocation gap
 */
export function calculateAllocationGap(
  current: number,
  target: number
): {
  gap: number;
  gapPercent: number;
  direction: 'over' | 'under' | 'balanced';
} {
  const gap = target - current;
  const gapPercent = target > 0 ? (gap / target) * 100 : 0;
  
  let direction: 'over' | 'under' | 'balanced' = 'balanced';
  if (gap > 1) direction = 'under';
  else if (gap < -1) direction = 'over';
  
  return {
    gap,
    gapPercent,
    direction,
  };
}

/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have the same length');
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, value, index) => {
    return sum + (value * weights[index]);
  }, 0);
  
  return weightedSum / totalWeight;
}

/**
 * Calculate XIRR (simplified approximation)
 * Note: Full XIRR calculation is complex, this is a simplified version
 */
export function calculateXIRR(
  investments: Array<{ date: Date; amount: number }>,
  currentValue: number,
  currentDate: Date
): number {
  // Simplified XIRR calculation
  // For production, use a proper XIRR library
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalDays = Math.floor(
    (currentDate.getTime() - investments[0].date.getTime()) / (1000 * 60 * 60 * 24)
  );
  const years = totalDays / 365;
  
  if (years <= 0 || totalInvested <= 0) return 0;
  
  // Simple CAGR approximation
  const cagr = (Math.pow(currentValue / totalInvested, 1 / years) - 1) * 100;
  
  return cagr;
}

