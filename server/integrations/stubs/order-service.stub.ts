/**
 * Order Service Integration Stub
 * Mock implementation for development/testing
 * Replace with actual Order Service integration when ready
 */

import { OrderService, OrderRequest, OrderResponse, OrderStatus, OrderServiceConfig } from '../interfaces/order-service.interface';

export class OrderServiceStub implements OrderService {
  private config: OrderServiceConfig;

  constructor(config: OrderServiceConfig) {
    this.config = config;
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    // Mock order creation - logs to console
    console.log('[Order Service Stub] Creating order:', {
      clientId: order.clientId,
      schemeId: order.schemeId,
      amount: order.amount,
      transactionType: order.transactionType,
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate 80% success rate for testing
    const shouldSucceed = Math.random() > 0.2;

    if (shouldSucceed) {
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        success: true,
        orderId,
        status: {
          orderId,
          status: 'Pending',
          currentStep: 'Order Created',
        },
        message: 'Order created successfully',
        estimatedSettlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      };
    } else {
      return {
        success: false,
        error: 'Insufficient funds or validation failed',
        message: 'Order creation failed',
      };
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    // Mock order status
    const statuses: OrderStatus['status'][] = ['Pending', 'In Progress', 'Executed', 'Settled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      orderId,
      status: randomStatus,
      currentStep: `Processing ${randomStatus}`,
      amount: 5000,
      nav: 100.5,
      units: 49.75,
    };
  }

  async cancelOrder(orderId: string, reason?: string): Promise<OrderResponse> {
    console.log('[Order Service Stub] Cancelling order:', { orderId, reason });

    return {
      success: true,
      orderId,
      status: {
        orderId,
        status: 'Cancelled',
      },
      message: 'Order cancelled successfully',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Actual Order Service Integration Stub
 * TODO: Implement actual Order Service API integration
 */
export class OrderServiceIntegration implements OrderService {
  private config: OrderServiceConfig;

  constructor(config: OrderServiceConfig) {
    this.config = config;
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    // TODO: Implement actual Order Service API call
    // Example:
    // const axios = require('axios');
    // const response = await axios.post(`${this.config.baseUrl}/api/orders`, order, {
    //   headers: { Authorization: `Bearer ${this.config.apiKey}` },
    //   timeout: this.config.timeout || 30000
    // });
    // return response.data;
    throw new Error('Order Service integration not yet implemented');
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    // TODO: Implement actual Order Service status API call
    // Example:
    // const response = await axios.get(`${this.config.baseUrl}/api/orders/${orderId}/status`, {
    //   headers: { Authorization: `Bearer ${this.config.apiKey}` }
    // });
    // return response.data;
    throw new Error('Order Service integration not yet implemented');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<OrderResponse> {
    // TODO: Implement actual Order Service cancel API call
    // Example:
    // const response = await axios.post(`${this.config.baseUrl}/api/orders/${orderId}/cancel`, { reason }, {
    //   headers: { Authorization: `Bearer ${this.config.apiKey}` }
    // });
    // return response.data;
    throw new Error('Order Service integration not yet implemented');
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Implement health check
    // Example:
    // const response = await axios.get(`${this.config.baseUrl}/health`);
    // return response.status === 200;
    return false;
  }
}

