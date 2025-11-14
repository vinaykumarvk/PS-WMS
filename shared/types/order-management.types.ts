/**
 * Foundation Layer - F1: Type Definitions
 * Comprehensive type definitions for Order Management System
 * Used across all modules (Quick Order, Portfolio-Aware, SIP, Switch, Redemption)
 */

// ============================================================================
// Core Transaction Types
// ============================================================================

export type TransactionType = 
  | 'Purchase' 
  | 'Redemption' 
  | 'Switch' 
  | 'Full Redemption' 
  | 'Full Switch';

export type OrderType = 
  | 'Initial Purchase' 
  | 'Additional Purchase';

export type TransactionMode = 
  | 'Physical' 
  | 'Email' 
  | 'Telephone';

export type OrderStatus = 
  | 'Pending' 
  | 'Pending Approval' 
  | 'In Progress' 
  | 'Settlement Pending' 
  | 'Executed' 
  | 'Settled' 
  | 'Failed' 
  | 'Settlement Reversal'
  | 'Cancelled';

export type RedemptionType = 
  | 'Standard' 
  | 'Instant' 
  | 'Full';

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

// ============================================================================
// Product & Scheme Types
// ============================================================================

export interface Product {
  id: number;
  schemeName: string;
  schemeCode?: string;
  category: string;
  subCategory?: string;
  nav: number;
  minInvestment: number;
  maxInvestment?: number;
  rta: string;
  riskLevel: string;
  amc?: string;
  launchDate?: string;
  aum?: number;
  expenseRatio?: number;
  fundManager?: string;
  isWhitelisted: boolean;
  cutOffTime?: string;
  isin?: string;
  fundHouse?: string;
}

export interface SchemeInfo {
  schemeName: string;
  schemeCode: string;
  amc: string;
  category: string;
  rta: string;
  launchDate: string;
  aum: number;
  expenseRatio: number;
  fundManager: string;
  riskLevel: string;
  minInvestment: number;
  maxInvestment?: number;
  cutOffTime: string;
  isin?: string;
}

// ============================================================================
// Cart & Order Types
// ============================================================================

export interface CartItem {
  id: string;
  productId: number;
  schemeName: string;
  transactionType: TransactionType;
  amount: number;
  units?: number;
  nav?: number;
  settlementAccount?: string;
  branchCode?: string;
  mode?: TransactionMode;
  dividendInstruction?: string;
  closeAc?: boolean;
  orderType?: OrderType;
  sourceSchemeId?: number;
  sourceSchemeName?: string;
}

export interface OrderFormData {
  cartItems: CartItem[];
  transactionMode: TransactionModeData;
  investmentAccount: InvestmentAccount | null;
  settlementAccount: InvestmentAccount | null;
  branchCode: string;
  nominees: Nominee[];
  optOutOfNomination: boolean;
  dividendInstruction?: string;
  euin?: string;
  fullSwitchData?: FullSwitchData | null;
  fullRedemptionData?: FullRedemptionData | null;
}

export interface Order {
  id: number;
  modelOrderId: string;
  clientId: number;
  orderFormData: OrderFormData;
  status: OrderStatus;
  submittedAt: string;
  authorizedAt?: string;
  authorizedBy?: number;
  rejectedAt?: string;
  rejectedReason?: string;
  rtaRefNo?: string;
  orderPaymentReference?: string;
  pgPaymentReferenceNo?: string;
  paymentlinkedstatus?: string;
  payremarks?: string;
  ipAddress?: string;
  traceId?: string;
}

// ============================================================================
// Nominee Types
// ============================================================================

export interface Nominee {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  pan: string;
  percentage: number;
  guardianName?: string;
  guardianPan?: string;
  guardianRelationship?: string;
  isMinor?: boolean;
}

// ============================================================================
// Transaction Mode Types
// ============================================================================

export interface TransactionModeData {
  mode: TransactionMode;
  email?: string;
  phoneNumber?: string;
  physicalAddress?: string;
  euin?: string;
}

// ============================================================================
// Account Types
// ============================================================================

export interface InvestmentAccount {
  id: number;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountType: string;
  isActive: boolean;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// ============================================================================
// Full Switch/Redemption Types
// ============================================================================

export interface FullSwitchData {
  sourceScheme: string;
  targetScheme: string;
  units: number;
  closeAc: boolean;
}

export interface FullRedemptionData {
  schemeName: string;
  units: number;
  amount: number;
  closeAc: boolean;
}

// ============================================================================
// Quick Order Types (Module A)
// ============================================================================

export interface Favorite {
  id: string;
  productId: number;
  schemeName: string;
  addedAt: string;
  orderCount?: number;
}

export interface RecentOrder {
  id: string;
  productId: number;
  schemeName: string;
  amount: number;
  transactionType: TransactionType;
  orderDate: string;
}

export interface QuickOrder {
  productId: number;
  amount: number;
  transactionType: TransactionType;
  orderType?: OrderType;
}

export interface AmountPreset {
  label: string;
  value: number;
  icon?: string;
}

// ============================================================================
// Portfolio Types (Module B)
// ============================================================================

export interface PortfolioAllocation {
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
}

export interface PortfolioImpact {
  beforeAllocation: PortfolioAllocation;
  afterAllocation: PortfolioAllocation;
  changes: {
    category: string;
    change: number;
    changePercent: number;
  }[];
}

export interface RebalancingSuggestion {
  action: 'Buy' | 'Sell' | 'Switch';
  fromScheme?: string;
  toScheme: string;
  amount: number;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Holding {
  id: number;
  productId: number;
  schemeName: string;
  units: number;
  nav: number;
  currentValue: number;
  investedAmount: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: string;
}

// ============================================================================
// SIP Types (Module C)
// ============================================================================

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
  createdAt: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface SIPCalculatorInput {
  amount: number;
  frequency: SIPFrequency;
  duration: number; // in months
  expectedReturn: number; // annual percentage
}

export interface SIPCalculatorResult {
  totalInvested: number;
  expectedValue: number;
  estimatedReturns: number;
  returnPercentage: number;
  monthlyBreakdown: {
    month: number;
    invested: number;
    value: number;
    returns: number;
  }[];
}

export interface SIPCalendarEvent {
  date: string;
  planId: string;
  schemeName: string;
  amount: number;
  status: 'Scheduled' | 'Completed' | 'Failed' | 'Skipped';
}

// ============================================================================
// Switch Types (Module D)
// ============================================================================

export interface SwitchCalculation {
  sourceScheme: string;
  targetScheme: string;
  sourceUnits: number;
  sourceNAV: number;
  targetNAV: number;
  switchAmount: number;
  targetUnits: number;
  exitLoad?: number;
  exitLoadAmount?: number;
  netAmount: number;
  taxImplications?: {
    shortTermGain?: number;
    longTermGain?: number;
    taxAmount?: number;
  };
}

export interface PartialSwitch {
  sourceSchemeId: number;
  targetSchemeId: number;
  amount: number;
  units?: number;
}

export interface MultiSchemeSwitch {
  sourceSchemeId: number;
  targets: {
    schemeId: number;
    amount: number;
    percentage?: number;
  }[];
}

export interface SwitchRecommendation {
  fromScheme: string;
  toScheme: string;
  reason: string;
  expectedBenefit: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

// ============================================================================
// Redemption Types (Module E)
// ============================================================================

export interface RedemptionCalculation {
  schemeName: string;
  units: number;
  nav: number;
  grossAmount: number;
  exitLoad?: number;
  exitLoadAmount?: number;
  netAmount: number;
  tds?: number;
  finalAmount: number;
  settlementDate: string;
}

export interface InstantRedemptionEligibility {
  eligible: boolean;
  maxAmount: number;
  availableAmount: number;
  reason?: string;
}

export interface RedemptionHistory {
  id: string;
  orderId: number;
  schemeName: string;
  units: number;
  amount: number;
  redemptionType: RedemptionType;
  status: OrderStatus;
  redemptionDate: string;
  settlementDate?: string;
}

// ============================================================================
// Goal-Based Investing Types
// ============================================================================

export type GoalType = 
  | 'Retirement' 
  | 'Child Education' 
  | 'House Purchase' 
  | 'Vacation' 
  | 'Emergency Fund' 
  | 'Other';

export interface Goal {
  id: string;
  clientId: number;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  monthlyContribution?: number;
  schemes: {
    schemeId: number;
    allocation: number; // percentage
  }[];
  progress: number; // percentage (0-100)
  status: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface GoalAllocation {
  id: number;
  goalId: string;
  transactionId?: number;
  amount: number;
  allocatedAt: string;
  notes?: string;
}

export interface GoalProgress {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
  monthsRemaining: number;
  projectedCompletion?: string;
  onTrack: boolean;
  shortfall?: number;
}

export interface GoalRecommendation {
  goalId: string;
  goalName: string;
  recommendedAmount: number;
  recommendedSchemes: {
    schemeId: number;
    schemeName: string;
    allocation: number;
    reason: string;
  }[];
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  warnings?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// Event Types (for module communication)
// ============================================================================

export interface OrderEvent {
  type: 
    | 'order:added' 
    | 'order:updated' 
    | 'order:removed' 
    | 'order:submitted';
  payload: {
    item?: CartItem;
    order?: Order;
    [key: string]: any;
  };
}

export interface PortfolioEvent {
  type: 
    | 'portfolio:updated' 
    | 'allocation:changed';
  payload: {
    allocation?: PortfolioAllocation;
    holdings?: Holding[];
    [key: string]: any;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

