/**
 * Payment Gateway Integration Stub
 * Mock implementation for development/testing
 * Replace with actual provider implementation when ready
 */

import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, RefundResponse, PaymentGatewayConfig } from '../interfaces/payment-gateway.interface';

export class PaymentGatewayStub implements PaymentGateway {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    // Mock payment creation - logs to console
    console.log('[Payment Gateway Stub] Creating payment:', {
      amount: payment.amount,
      currency: payment.currency || 'INR',
      orderId: payment.orderId,
      description: payment.description,
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate 90% success rate for testing
    const shouldSucceed = Math.random() > 0.1;

    if (shouldSucceed) {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        success: true,
        paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        status: 'created',
        paymentLink: `https://mock-payment.example.com/pay/${paymentId}`,
        qrCode: `data:image/png;base64,mock-qr-code-${paymentId}`,
      };
    } else {
      return {
        success: false,
        error: 'Payment gateway temporarily unavailable',
        status: 'failed',
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    // Mock payment verification
    const statuses: PaymentStatus['status'][] = ['created', 'authorized', 'captured', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      paymentId,
      status: randomStatus,
      amount: 500000, // 5000 INR in paise
      currency: 'INR',
      capturedAt: randomStatus === 'captured' ? new Date() : undefined,
      failureReason: randomStatus === 'failed' ? 'Insufficient funds' : undefined,
    };
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResponse> {
    console.log('[Payment Gateway Stub] Processing refund:', { paymentId, amount, reason });

    return {
      success: true,
      refundId: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      paymentId,
      amount: amount || 500000,
      status: 'initiated',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Razorpay Payment Gateway Stub
 * TODO: Implement actual Razorpay API integration
 */
export class RazorpayPaymentGateway implements PaymentGateway {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    // TODO: Implement Razorpay API call
    // Example:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: this.config.apiKey,
    //   key_secret: this.config.apiSecret
    // });
    // const order = await razorpay.orders.create({
    //   amount: payment.amount,
    //   currency: payment.currency || 'INR',
    //   receipt: payment.orderId,
    //   notes: payment.metadata
    // });
    throw new Error('Razorpay Payment Gateway not yet implemented');
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    // TODO: Implement Razorpay payment verification
    // const payment = await razorpay.payments.fetch(paymentId);
    throw new Error('Razorpay Payment Gateway not yet implemented');
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResponse> {
    // TODO: Implement Razorpay refund
    // const refund = await razorpay.payments.refund(paymentId, { amount, notes: { reason } });
    throw new Error('Razorpay Payment Gateway not yet implemented');
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check Razorpay API health
    return false;
  }
}

/**
 * Stripe Payment Gateway Stub
 * TODO: Implement actual Stripe API integration
 */
export class StripePaymentGateway implements PaymentGateway {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    // TODO: Implement Stripe API call
    // Example:
    // const stripe = require('stripe')(this.config.apiSecret);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: payment.amount,
    //   currency: payment.currency || 'inr',
    //   metadata: payment.metadata
    // });
    throw new Error('Stripe Payment Gateway not yet implemented');
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    // TODO: Implement Stripe payment verification
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    throw new Error('Stripe Payment Gateway not yet implemented');
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResponse> {
    // TODO: Implement Stripe refund
    // const refund = await stripe.refunds.create({
    //   payment_intent: paymentId,
    //   amount: amount,
    //   reason: reason || 'requested_by_customer'
    // });
    throw new Error('Stripe Payment Gateway not yet implemented');
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check Stripe API health
    return false;
  }
}

