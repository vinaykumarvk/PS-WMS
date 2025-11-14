/**
 * Foundation Layer - F2: API Schemas (Zod)
 * Zod validation schemas for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Order Management Schemas
// ============================================================================

export const transactionTypeSchema = z.enum([
  'Purchase',
  'Redemption',
  'Switch',
  'Full Redemption',
  'Full Switch',
]);

export const orderTypeSchema = z.enum([
  'Initial Purchase',
  'Additional Purchase',
]);

export const transactionModeSchema = z.enum([
  'Physical',
  'Email',
  'Telephone',
]);

export const orderStatusSchema = z.enum([
  'Pending',
  'Pending Approval',
  'In Progress',
  'Settlement Pending',
  'Executed',
  'Settled',
  'Failed',
  'Settlement Reversal',
  'Cancelled',
]);

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.number().int().positive(),
  schemeName: z.string().min(1),
  transactionType: transactionTypeSchema,
  amount: z.number().positive(),
  units: z.number().positive().optional(),
  nav: z.number().positive().optional(),
  settlementAccount: z.string().optional(),
  branchCode: z.string().optional(),
  mode: transactionModeSchema.optional(),
  dividendInstruction: z.string().optional(),
  closeAc: z.boolean().optional(),
  orderType: orderTypeSchema.optional(),
  sourceSchemeId: z.number().int().positive().optional(),
  sourceSchemeName: z.string().optional(),
});

export const nomineeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  relationship: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  percentage: z.number().min(0).max(100),
  guardianName: z.string().optional(),
  guardianPan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  guardianRelationship: z.string().optional(),
  isMinor: z.boolean().optional(),
});

export const transactionModeDataSchema = z.object({
  mode: transactionModeSchema,
  email: z.string().email().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  physicalAddress: z.string().optional(),
  euin: z.string().optional(),
});

export const submitOrderRequestSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1),
  transactionMode: transactionModeDataSchema,
  nominees: z.array(nomineeSchema).optional(),
  optOutOfNomination: z.boolean(),
  clientId: z.number().int().positive().optional(),
  fullSwitchData: z.object({
    sourceScheme: z.string(),
    targetScheme: z.string(),
    units: z.number().positive(),
    closeAc: z.boolean(),
  }).optional().nullable(),
  fullRedemptionData: z.object({
    schemeName: z.string(),
    units: z.number().positive(),
    amount: z.number().positive(),
    closeAc: z.boolean(),
  }).optional().nullable(),
});

export const getOrdersQuerySchema = paginationSchema.extend({
  clientId: z.number().int().positive().optional(),
  status: z.union([orderStatusSchema, z.array(orderStatusSchema)]).optional(),
}).merge(dateRangeSchema);

// ============================================================================
// Quick Order Schemas
// ============================================================================

export const quickOrderRequestSchema = z.object({
  productId: z.number().int().positive(),
  amount: z.number().positive(),
  transactionType: transactionTypeSchema,
  orderType: orderTypeSchema.optional(),
});

export const addFavoriteRequestSchema = z.object({
  productId: z.number().int().positive(),
});

// ============================================================================
// Portfolio Schemas
// ============================================================================

export const getPortfolioQuerySchema = z.object({
  clientId: z.number().int().positive(),
  includeHoldings: z.boolean().optional().default(true),
  includePerformance: z.boolean().optional().default(false),
});

export const impactPreviewRequestSchema = z.object({
  clientId: z.number().int().positive(),
  order: z.array(cartItemSchema),
});

export const targetAllocationSchema = z.object({
  equity: z.number().min(0).max(100),
  debt: z.number().min(0).max(100),
  hybrid: z.number().min(0).max(100),
  others: z.number().min(0).max(100),
}).refine(
  (data) => Math.abs((data.equity + data.debt + data.hybrid + data.others) - 100) < 0.01,
  { message: 'Allocation percentages must total 100%' }
);

export const rebalancingSuggestionsQuerySchema = z.object({
  clientId: z.number().int().positive(),
  targetAllocation: targetAllocationSchema.optional(),
});

// ============================================================================
// SIP Schemas
// ============================================================================

export const sipFrequencySchema = z.enum([
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
]);

export const createSIPRequestSchema = z.object({
  clientId: z.number().int().positive(),
  schemeId: z.number().int().positive(),
  amount: z.number().positive().min(1000),
  frequency: sipFrequencySchema,
  startDate: z.string().datetime(),
  installments: z.number().int().positive(),
  endDate: z.string().datetime().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
});

export const modifySIPRequestSchema = z.object({
  planId: z.string().min(1),
  newAmount: z.number().positive().min(1000).optional(),
  newFrequency: sipFrequencySchema.optional(),
  pauseUntil: z.string().datetime().optional(),
});

export const sipCalculatorRequestSchema = z.object({
  amount: z.number().positive().min(1000),
  frequency: sipFrequencySchema,
  duration: z.number().int().positive(), // in months
  expectedReturn: z.number().min(0).max(100), // annual percentage
  startDate: z.string().datetime().optional(),
});

export const getSIPCalendarQuerySchema = z.object({
  clientId: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// ============================================================================
// Switch Schemas
// ============================================================================

export const calculateSwitchRequestSchema = z.object({
  sourceSchemeId: z.number().int().positive(),
  targetSchemeId: z.number().int().positive(),
  amount: z.number().positive().optional(),
  units: z.number().positive().optional(),
}).refine(
  (data) => data.amount !== undefined || data.units !== undefined,
  { message: 'Either amount or units must be provided' }
);

export const executeSwitchRequestSchema = z.object({
  sourceSchemeId: z.number().int().positive(),
  targetSchemeId: z.number().int().positive(),
  amount: z.number().positive().optional(),
  units: z.number().positive().optional(),
  isFullSwitch: z.boolean().optional().default(false),
}).refine(
  (data) => data.amount !== undefined || data.units !== undefined || data.isFullSwitch,
  { message: 'Either amount, units, or isFullSwitch must be provided' }
);

export const partialSwitchRequestSchema = z.object({
  sourceSchemeId: z.number().int().positive(),
  targetSchemeId: z.number().int().positive(),
  amount: z.number().positive(),
});

export const multiSchemeSwitchRequestSchema = z.object({
  sourceSchemeId: z.number().int().positive(),
  targets: z.array(z.object({
    schemeId: z.number().int().positive(),
    amount: z.number().positive(),
    percentage: z.number().min(0).max(100).optional(),
  })).min(1),
});

// ============================================================================
// Redemption Schemas
// ============================================================================

export const redemptionTypeSchema = z.enum([
  'Standard',
  'Instant',
  'Full',
]);

export const calculateRedemptionRequestSchema = z.object({
  schemeId: z.number().int().positive(),
  units: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  redemptionType: redemptionTypeSchema.optional().default('Standard'),
}).refine(
  (data) => data.units !== undefined || data.amount !== undefined,
  { message: 'Either units or amount must be provided' }
);

export const executeRedemptionRequestSchema = z.object({
  schemeId: z.number().int().positive(),
  units: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  redemptionType: redemptionTypeSchema,
  isFullRedemption: z.boolean().optional().default(false),
}).refine(
  (data) => data.units !== undefined || data.amount !== undefined || data.isFullRedemption,
  { message: 'Either units, amount, or isFullRedemption must be provided' }
);

export const checkInstantRedemptionEligibilitySchema = z.object({
  schemeId: z.number().int().positive(),
  amount: z.number().positive(),
});

