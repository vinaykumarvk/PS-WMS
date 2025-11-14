/**
 * Foundation Layer - F1: Automation Types
 * Type definitions for Automation Features Module (Module 11)
 */

import type { APIResponse } from './api.types';
import type { Goal } from './order-management.types';

// ============================================================================
// Auto-Invest Rule Types
// ============================================================================

export type AutoInvestFrequency = 
  | 'Daily' 
  | 'Weekly' 
  | 'Monthly' 
  | 'Quarterly';

export type AutoInvestTrigger = 
  | 'Date' 
  | 'Goal Progress' 
  | 'Portfolio Drift' 
  | 'Market Condition';

export type AutoInvestStatus = 
  | 'Active' 
  | 'Paused' 
  | 'Cancelled' 
  | 'Completed';

export interface AutoInvestRule {
  id: string;
  clientId: number;
  name: string;
  description?: string;
  
  // Investment Configuration
  schemeId: number;
  schemeName: string;
  amount: number;
  frequency: AutoInvestFrequency;
  
  // Trigger Configuration
  triggerType: AutoInvestTrigger;
  triggerConfig: TriggerConfig;
  
  // Goal Association (optional)
  goalId?: string;
  goalName?: string;
  
  // Schedule Configuration
  startDate: string;
  endDate?: string;
  nextExecutionDate?: string;
  
  // Status & Control
  status: AutoInvestStatus;
  isEnabled: boolean;
  
  // Limits & Safety
  maxTotalAmount?: number;
  maxPerExecution?: number;
  minBalanceRequired?: number;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
  executionCount: number;
  lastExecutionDate?: string;
  lastExecutionStatus?: 'Success' | 'Failed';
  lastExecutionError?: string;
}

export interface TriggerConfig {
  // Date-based trigger
  dayOfMonth?: number; // 1-31
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  time?: string; // HH:mm format
  
  // Goal-based trigger
  goalProgressThreshold?: number; // Percentage (0-100)
  goalProgressDirection?: 'above' | 'below';
  
  // Portfolio drift trigger
  driftThreshold?: number; // Percentage deviation
  rebalanceThreshold?: number; // Percentage to rebalance
  
  // Market condition trigger
  marketCondition?: 'Bull' | 'Bear' | 'Neutral';
  navChangeThreshold?: number; // Percentage change
  
  // Custom conditions
  customConditions?: Record<string, any>;
}

export interface CreateAutoInvestRuleInput {
  clientId: number;
  name: string;
  description?: string;
  schemeId: number;
  amount: number;
  frequency: AutoInvestFrequency;
  triggerType: AutoInvestTrigger;
  triggerConfig: TriggerConfig;
  goalId?: string;
  startDate: string;
  endDate?: string;
  maxTotalAmount?: number;
  maxPerExecution?: number;
  minBalanceRequired?: number;
}

export interface UpdateAutoInvestRuleInput {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: AutoInvestFrequency;
  triggerType?: AutoInvestTrigger;
  triggerConfig?: TriggerConfig;
  status?: AutoInvestStatus;
  isEnabled?: boolean;
  endDate?: string;
  maxTotalAmount?: number;
  maxPerExecution?: number;
}

// ============================================================================
// Rebalancing Automation Types
// ============================================================================

export type RebalancingStrategy = 
  | 'Threshold-Based' 
  | 'Time-Based' 
  | 'Drift-Based' 
  | 'Hybrid';

export type RebalancingStatus = 
  | 'Active' 
  | 'Paused' 
  | 'Completed';

export interface RebalancingRule {
  id: string;
  clientId: number;
  name: string;
  description?: string;
  
  // Strategy Configuration
  strategy: RebalancingStrategy;
  
  // Target Allocation
  targetAllocation: {
    equity: number;
    debt: number;
    hybrid: number;
    [key: string]: number;
  };
  
  // Threshold Configuration
  thresholdPercent: number; // Deviation threshold (e.g., 5%)
  rebalanceAmount?: number; // Fixed amount to rebalance
  
  // Schedule Configuration
  frequency?: AutoInvestFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  
  // Trigger Conditions
  triggerOnDrift: boolean;
  triggerOnSchedule: boolean;
  minDriftPercent?: number;
  
  // Execution Settings
  executeAutomatically: boolean;
  requireConfirmation: boolean;
  
  // Status & Control
  status: RebalancingStatus;
  isEnabled: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  lastRebalancedDate?: string;
  nextRebalancingDate?: string;
  executionCount: number;
  lastExecutionStatus?: 'Success' | 'Failed' | 'Skipped';
}

export interface CreateRebalancingRuleInput {
  clientId: number;
  name: string;
  description?: string;
  strategy: RebalancingStrategy;
  targetAllocation: Record<string, number>;
  thresholdPercent: number;
  rebalanceAmount?: number;
  frequency?: AutoInvestFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  triggerOnDrift: boolean;
  triggerOnSchedule: boolean;
  minDriftPercent?: number;
  executeAutomatically: boolean;
  requireConfirmation: boolean;
}

export interface RebalancingExecution {
  id: string;
  ruleId: string;
  clientId: number;
  executionDate: string;
  status: 'Pending' | 'Executed' | 'Failed' | 'Cancelled';
  
  // Current vs Target
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  driftPercent: number;
  
  // Actions Generated
  actions: RebalancingAction[];
  
  // Execution Details
  executedAt?: string;
  executedBy?: number;
  orderIds?: string[];
  error?: string;
}

export interface RebalancingAction {
  type: 'Purchase' | 'Redemption' | 'Switch';
  schemeId: number;
  schemeName: string;
  amount: number;
  units?: number;
  reason: string;
}

// ============================================================================
// Trigger-Based Orders Types
// ============================================================================

export type TriggerType = 
  | 'Price' 
  | 'NAV' 
  | 'Portfolio Value' 
  | 'Goal Progress' 
  | 'Date' 
  | 'Custom';

export type TriggerCondition = 
  | 'Greater Than' 
  | 'Less Than' 
  | 'Equals' 
  | 'Crosses Above' 
  | 'Crosses Below';

export type TriggerOrderStatus = 
  | 'Active' 
  | 'Triggered' 
  | 'Executed' 
  | 'Cancelled' 
  | 'Expired';

export interface TriggerOrder {
  id: string;
  clientId: number;
  name: string;
  description?: string;
  
  // Trigger Configuration
  triggerType: TriggerType;
  triggerCondition: TriggerCondition;
  triggerValue: number;
  triggerField?: string; // e.g., 'nav', 'portfolioValue', 'goalProgress'
  
  // Order Configuration
  orderType: 'Purchase' | 'Redemption' | 'Switch';
  schemeId: number;
  schemeName: string;
  amount?: number;
  units?: number;
  
  // Target Configuration (for switches)
  targetSchemeId?: number;
  targetSchemeName?: string;
  
  // Goal Association
  goalId?: string;
  goalName?: string;
  
  // Validity
  validFrom: string;
  validUntil?: string;
  
  // Status & Control
  status: TriggerOrderStatus;
  isEnabled: boolean;
  
  // Execution Details
  triggeredAt?: string;
  executedAt?: string;
  executedOrderId?: string;
  executionStatus?: 'Success' | 'Failed';
  executionError?: string;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
}

export interface CreateTriggerOrderInput {
  clientId: number;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerCondition: TriggerCondition;
  triggerValue: number;
  triggerField?: string;
  orderType: 'Purchase' | 'Redemption' | 'Switch';
  schemeId: number;
  amount?: number;
  units?: number;
  targetSchemeId?: number;
  goalId?: string;
  validFrom: string;
  validUntil?: string;
}

// ============================================================================
// Notification Preferences Types
// ============================================================================

export type NotificationChannel = 
  | 'Email' 
  | 'SMS' 
  | 'Push' 
  | 'In-App';

export type NotificationEvent = 
  | 'Order Submitted' 
  | 'Order Executed' 
  | 'Order Failed' 
  | 'Order Settled' 
  | 'Auto-Invest Executed' 
  | 'Auto-Invest Failed' 
  | 'Rebalancing Triggered' 
  | 'Rebalancing Executed' 
  | 'Trigger Order Activated' 
  | 'Goal Milestone Reached' 
  | 'Portfolio Alert' 
  | 'Market Update';

export interface NotificationPreference {
  id: string;
  clientId: number;
  userId?: number; // For user-level preferences
  
  // Event Configuration
  event: NotificationEvent;
  
  // Channel Preferences
  channels: NotificationChannel[];
  
  // Conditions
  enabled: boolean;
  quietHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  
  // Filters
  minAmount?: number; // Only notify if amount >= this
  schemes?: number[]; // Only notify for these schemes
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNotificationPreferenceInput {
  clientId: number;
  userId?: number;
  event: NotificationEvent;
  channels: NotificationChannel[];
  enabled: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  schemes?: number[];
}

export interface NotificationLog {
  id: string;
  clientId: number;
  userId?: number;
  event: NotificationEvent;
  channel: NotificationChannel;
  status: 'Sent' | 'Failed' | 'Pending';
  sentAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Automation Execution Log Types
// ============================================================================

export interface AutomationExecutionLog {
  id: string;
  automationType: 'AutoInvest' | 'Rebalancing' | 'TriggerOrder';
  automationId: string;
  clientId: number;
  executionDate: string;
  status: 'Success' | 'Failed' | 'Skipped';
  orderId?: string;
  error?: string;
  details?: Record<string, any>;
  createdAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GetAutoInvestRulesResponse extends APIResponse<AutoInvestRule[]> {}
export interface GetAutoInvestRuleResponse extends APIResponse<AutoInvestRule> {}
export interface CreateAutoInvestRuleResponse extends APIResponse<AutoInvestRule> {}
export interface UpdateAutoInvestRuleResponse extends APIResponse<AutoInvestRule> {}

export interface GetRebalancingRulesResponse extends APIResponse<RebalancingRule[]> {}
export interface GetRebalancingRuleResponse extends APIResponse<RebalancingRule> {}
export interface CreateRebalancingRuleResponse extends APIResponse<RebalancingRule> {}
export interface ExecuteRebalancingResponse extends APIResponse<RebalancingExecution> {}

export interface GetTriggerOrdersResponse extends APIResponse<TriggerOrder[]> {}
export interface GetTriggerOrderResponse extends APIResponse<TriggerOrder> {}
export interface CreateTriggerOrderResponse extends APIResponse<TriggerOrder> {}

export interface GetNotificationPreferencesResponse extends APIResponse<NotificationPreference[]> {}
export interface CreateNotificationPreferenceResponse extends APIResponse<NotificationPreference> {}
export interface GetNotificationLogsResponse extends APIResponse<NotificationLog[]> {}

export interface GetAutomationExecutionLogsResponse extends APIResponse<AutomationExecutionLog[]> {}

