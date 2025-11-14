/**
 * Order Management Type Definitions
 * Based on BRD v1.0
 */

export type TransactionType = 'Purchase' | 'Redemption' | 'Switch' | 'Full Redemption' | 'Full Switch';
export type OrderType = 'Initial Purchase' | 'Additional Purchase';
export type TransactionMode = 'Physical' | 'Email' | 'Telephone';
export type OrderStatus = 
  | 'Pending' 
  | 'Pending Approval' 
  | 'In Progress' 
  | 'Settlement Pending' 
  | 'Executed' 
  | 'Settled' 
  | 'Failed' 
  | 'Settlement Reversal';

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
}

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
  closeAc?: boolean; // For Full Switch/Redemption
  orderType?: OrderType; // Initial Purchase or Additional Purchase
  sourceSchemeId?: number; // For Switch transactions
  sourceSchemeName?: string; // For Switch transactions
}

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
}

export interface TransactionModeData {
  mode: TransactionMode;
  email?: string;
  phoneNumber?: string;
  physicalAddress?: string;
  euin?: string;
}

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
}

export interface OrderInfo {
  productId: number;
  schemeName: string;
  transactionType: TransactionType;
  amount: number;
  units?: number;
  settlementAccount?: string;
  branchCode?: string;
  mode?: TransactionMode;
  dividendInstruction?: string;
}

export interface Document {
  id: number;
  type: 'Factsheet' | 'KIM' | 'SID' | 'SAI' | 'Addendum';
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Deviation {
  type: 'Amount Below Minimum' | 'Amount Above Maximum' | 'Full Redemption' | 'Close Account';
  description: string;
  impact: string;
  resolutionOptions: string[];
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface FullSwitchData {
  sourceScheme: string;
  targetScheme: string;
  units: number; // Exact units, no rounding
  closeAc: boolean; // Always true for Full Switch
}

export interface FullRedemptionData {
  schemeName: string;
  units: number; // Exact units, no rounding
  amount: number;
  closeAc: boolean; // Always true for Full Redemption
}

// ============================================================================
// Goal-Based Investing Types (Module 3)
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

