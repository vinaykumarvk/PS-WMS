/**
 * Foundation Layer - F1: API Types
 * Common API request/response types used across all modules
 */

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    timestamp: string;
    requestId?: string;
    traceId?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  code?: string;
  details?: Record<string, any>;
}

// ============================================================================
// Request Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: FilterParams;
}

// ============================================================================
// Order Management API Types
// ============================================================================

export interface SubmitOrderRequest {
  cartItems: any[];
  transactionMode: any;
  nominees?: any[];
  optOutOfNomination: boolean;
  clientId?: number;
  fullSwitchData?: any;
  fullRedemptionData?: any;
}

export interface SubmitOrderResponse {
  order: {
    id: number;
    modelOrderId: string;
    status: string;
    submittedAt: string;
  };
}

// ============================================================================
// Quick Order API Types
// ============================================================================

export interface QuickOrderRequest {
  productId: number;
  amount: number;
  transactionType: string;
  orderType?: string;
}

export interface GetFavoritesResponse {
  favorites: any[];
}

export interface GetRecentOrdersResponse {
  orders: any[];
}

// ============================================================================
// Portfolio API Types
// ============================================================================

export interface GetPortfolioRequest {
  clientId: number;
  includeHoldings?: boolean;
  includePerformance?: boolean;
}

export interface GetPortfolioResponse {
  portfolio: any;
  holdings?: any[];
  performance?: any;
}

export interface GetImpactPreviewRequest {
  clientId: number;
  order: any;
}

export interface GetImpactPreviewResponse {
  impact: any;
}

export interface GetRebalancingSuggestionsRequest {
  clientId: number;
  targetAllocation?: any;
}

export interface GetRebalancingSuggestionsResponse {
  suggestions: any[];
}

// ============================================================================
// SIP API Types
// ============================================================================

export interface CreateSIPRequest {
  clientId: number;
  schemeId: number;
  amount: number;
  frequency: string;
  startDate: string;
  installments: number;
  endDate?: string;
}

export interface CreateSIPResponse {
  plan: any;
}

export interface ModifySIPRequest {
  planId: string;
  newAmount?: number;
  newFrequency?: string;
  pauseUntil?: string;
}

export interface GetSIPPerformanceRequest {
  planId: string;
  includeBreakdown?: boolean;
}

export interface GetSIPPerformanceResponse {
  performance: any;
  breakdown?: any[];
}

// ============================================================================
// Switch API Types
// ============================================================================

export interface CalculateSwitchRequest {
  sourceSchemeId: number;
  targetSchemeId: number;
  amount?: number;
  units?: number;
}

export interface CalculateSwitchResponse {
  calculation: any;
}

export interface ExecuteSwitchRequest {
  sourceSchemeId: number;
  targetSchemeId: number;
  amount?: number;
  units?: number;
  isFullSwitch?: boolean;
}

// ============================================================================
// Redemption API Types
// ============================================================================

export interface CalculateRedemptionRequest {
  schemeId: number;
  units?: number;
  amount?: number;
  redemptionType?: string;
}

export interface CalculateRedemptionResponse {
  calculation: any;
}

export interface ExecuteRedemptionRequest {
  schemeId: number;
  units?: number;
  amount?: number;
  redemptionType: string;
  isFullRedemption?: boolean;
}

export interface CheckInstantRedemptionEligibilityRequest {
  schemeId: number;
  amount: number;
}

export interface CheckInstantRedemptionEligibilityResponse {
  eligible: boolean;
  maxAmount: number;
  availableAmount: number;
  reason?: string;
}

// ============================================================================
// Common Query Parameters
// ============================================================================

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface StatusFilterParams {
  status?: string | string[];
}

export interface ClientFilterParams {
  clientId?: number;
}

