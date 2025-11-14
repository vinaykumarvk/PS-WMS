/**
 * Foundation Layer - F1: SIP Types
 * Types for SIP Builder and Manager features
 */

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export type SIPFrequency = 
  | 'Daily' 
  | 'Weekly' 
  | 'Monthly' 
  | 'Quarterly';

export type SIPStatus = 
  | 'Active' 
  | 'Paused' 
  | 'Cancelled' 
  | 'Completed' 
  | 'Failed';

export interface SIPPlan {
  id: string;
  clientId: number;
  schemeId: number;
  schemeName: string;
  amount: number;
  frequency: SIPFrequency;
  startDate: string;
  endDate?: string;
  installments: number;
  completedInstallments: number;
  status: SIPStatus;
  nextInstallmentDate?: string;
  totalInvested?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  createdAt: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  lastExecutionDate?: string;
  lastExecutionStatus?: 'Success' | 'Failed';
  failureCount?: number;
}

export interface SIPBuilderInput {
  schemeId: number;
  amount: number;
  frequency: SIPFrequency;
  startDate: string;
  endDate?: string;
  installments?: number;
  dayOfMonth?: number; // For monthly SIPs
  dayOfWeek?: number; // For weekly SIPs
}

export interface SIPCalculatorInput {
  amount: number;
  frequency: SIPFrequency;
  duration: number; // in months
  expectedReturn: number; // annual percentage
  startDate?: string;
}

export interface SIPCalculatorResult {
  totalInvested: number;
  expectedValue: number;
  estimatedReturns: number;
  returnPercentage: number;
  monthlyBreakdown: SIPMonthlyBreakdown[];
  summary: {
    totalInstallments: number;
    averageNAV: number;
    finalNAV: number;
  };
}

export interface SIPMonthlyBreakdown {
  month: number;
  date: string;
  invested: number;
  cumulativeInvested: number;
  value: number;
  returns: number;
  returnPercentage: number;
}

export interface SIPCalendarEvent {
  date: string;
  planId: string;
  schemeName: string;
  amount: number;
  status: 'Scheduled' | 'Completed' | 'Failed' | 'Skipped';
  executionDate?: string;
  units?: number;
  nav?: number;
}

export interface SIPModification {
  planId: string;
  newAmount?: number;
  newFrequency?: SIPFrequency;
  pauseUntil?: string;
  resumeDate?: string;
}

export interface SIPPerformance {
  planId: string;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  xirr?: number; // Extended Internal Rate of Return
  vsLumpSum: {
    lumpSumValue: number;
    sipValue: number;
    difference: number;
    differencePercent: number;
  };
}

