/**
 * Payment Gateway Integration Interface
 * Defines the contract for payment processing (Razorpay, Stripe, etc.)
 */

export interface PaymentGateway {
  /**
   * Create a payment request
   */
  createPayment(payment: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify payment status
   */
  verifyPayment(paymentId: string): Promise<PaymentStatus>;

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResponse>;

  /**
   * Check if gateway is available
   */
  isAvailable(): Promise<boolean>;
}

export interface PaymentRequest {
  amount: number; // Amount in paise (for INR)
  currency?: string; // Default: 'INR'
  orderId?: string; // Reference order ID
  description?: string;
  customerId?: number;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: 'created' | 'authorized' | 'captured' | 'failed';
  paymentLink?: string; // For payment links
  qrCode?: string; // For UPI QR codes
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  capturedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  paymentId: string;
  amount: number;
  status?: 'initiated' | 'processed' | 'failed';
  error?: string;
}

export interface PaymentGatewayConfig {
  provider: 'Razorpay' | 'Stripe' | 'PayU' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  merchantId?: string;
  mode?: 'live' | 'sandbox';
}

