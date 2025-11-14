/**
 * RTA (Registrar and Transfer Agent) Integration Interface
 * Defines the contract for RTA integrations (CAMS, KFintech, etc.)
 */

export interface RTAService {
  /**
   * Submit transaction to RTA
   */
  submitTransaction(transaction: RTATransaction): Promise<RTAResponse>;

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): Promise<RTAStatus>;

  /**
   * Get folio details
   */
  getFolioDetails(folioNumber: string, schemeId: number): Promise<FolioDetails>;

  /**
   * Get account statement
   */
  getAccountStatement(folioNumber: string, schemeId: number, startDate: string, endDate: string): Promise<AccountStatement>;

  /**
   * Check if RTA is available
   */
  isAvailable(): Promise<boolean>;
}

export interface RTATransaction {
  transactionType: 'Purchase' | 'Redemption' | 'Switch';
  schemeId: number;
  amount: number;
  units?: number;
  folioNumber?: string;
  clientId: number;
  clientPAN: string;
  bankAccount: BankAccount;
  nomineeDetails?: NomineeDetails[];
  transactionMode: 'Physical' | 'Email' | 'Telephone';
  euin?: string;
  metadata?: Record<string, any>;
}

export interface BankAccount {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  accountType: 'Savings' | 'Current';
}

export interface NomineeDetails {
  name: string;
  relationship: string;
  dateOfBirth: string;
  pan: string;
  percentage: number;
  guardianName?: string;
  guardianPan?: string;
  guardianRelationship?: string;
}

export interface RTAResponse {
  success: boolean;
  transactionId?: string;
  status?: 'Submitted' | 'Processing' | 'Completed' | 'Failed';
  message?: string;
  error?: string;
  folioNumber?: string;
  units?: number;
  nav?: number;
}

export interface RTAStatus {
  transactionId: string;
  status: 'Submitted' | 'Processing' | 'Completed' | 'Failed' | 'Rejected';
  currentStep?: string;
  completedAt?: Date;
  error?: string;
  folioNumber?: string;
  units?: number;
  nav?: number;
}

export interface FolioDetails {
  folioNumber: string;
  schemeId: number;
  schemeName: string;
  units: number;
  currentValue: number;
  investedAmount: number;
  gainLoss: number;
  gainLossPercent: number;
  lastTransactionDate?: Date;
}

export interface AccountStatement {
  folioNumber: string;
  schemeId: number;
  startDate: string;
  endDate: string;
  transactions: StatementTransaction[];
  openingBalance: number;
  closingBalance: number;
}

export interface StatementTransaction {
  date: string;
  type: 'Purchase' | 'Redemption' | 'Switch' | 'Dividend' | 'Bonus';
  amount: number;
  units?: number;
  nav?: number;
  balance: number;
}

export interface RTAServiceConfig {
  provider: 'CAMS' | 'KFintech' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  arn?: string; // ARN (ARN) code
}

