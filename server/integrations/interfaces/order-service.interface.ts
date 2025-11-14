/**
 * Order Service Integration Interface
 * Defines the contract for order creation and management
 */

export interface OrderService {
  /**
   * Create a new order
   */
  createOrder(order: OrderRequest): Promise<OrderResponse>;

  /**
   * Get order status
   */
  getOrderStatus(orderId: string): Promise<OrderStatus>;

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string, reason?: string): Promise<OrderResponse>;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}

export interface OrderRequest {
  clientId: number;
  schemeId: number;
  amount: number;
  transactionType: 'Purchase' | 'Redemption' | 'Switch';
  orderType?: 'Initial Purchase' | 'Additional Purchase';
  sourceSchemeId?: number; // For switch transactions
  paymentMethod?: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'Cheque' | 'Auto Debit';
  bankAccountId?: number;
  folioNumber?: string;
  transactionMode?: 'Physical' | 'Email' | 'Telephone';
  euin?: string;
  nomineeDetails?: NomineeDetails[];
  metadata?: Record<string, any>;
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

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  status?: OrderStatus;
  message?: string;
  error?: string;
  estimatedSettlementDate?: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'Pending' | 'Pending Approval' | 'In Progress' | 'Executed' | 'Settled' | 'Failed' | 'Cancelled';
  currentStep?: string;
  executedAt?: Date;
  settledAt?: Date;
  units?: number;
  nav?: number;
  amount?: number;
  error?: string;
}

export interface OrderServiceConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}

