/**
 * Foundation Layer - F2: Order Service Contract
 * Defines the interface contract for Order Service
 * All implementations must follow this contract
 */

import type { 
  Order, 
  OrderFormData, 
  CartItem,
  OrderStatus,
  APIResponse 
} from '../types/order-management.types';

/**
 * Order Service Interface
 * Defines all methods available for order operations
 */
export interface IOrderService {
  /**
   * Create a new order
   */
  createOrder(orderData: OrderFormData, clientId: number): Promise<APIResponse<Order>>;

  /**
   * Get order by ID
   */
  getOrderById(orderId: number, userId?: number): Promise<APIResponse<Order | null>>;

  /**
   * Get orders with filters
   */
  getOrders(filters: {
    userId?: number;
    clientId?: number;
    status?: OrderStatus | OrderStatus[];
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<APIResponse<Order[]>>;

  /**
   * Update order status
   */
  updateOrderStatus(
    orderId: number, 
    status: OrderStatus, 
    userId: number,
    reason?: string
  ): Promise<APIResponse<Order>>;

  /**
   * Claim order for authorization
   */
  claimOrder(orderId: number, userId: number): Promise<APIResponse<Order>>;

  /**
   * Release order back to queue
   */
  releaseOrder(orderId: number, userId: number): Promise<APIResponse<Order>>;

  /**
   * Cancel order
   */
  cancelOrder(orderId: number, userId: number, reason: string): Promise<APIResponse<Order>>;
}

/**
 * Order Validation Service Interface
 */
export interface IOrderValidationService {
  /**
   * Validate cart items
   */
  validateCartItems(items: CartItem[]): Promise<APIResponse<{ isValid: boolean; errors: string[] }>>;

  /**
   * Validate order before submission
   */
  validateOrder(orderData: OrderFormData): Promise<APIResponse<{ isValid: boolean; errors: string[]; warnings: string[] }>>;

  /**
   * Validate amount against product limits
   */
  validateAmount(productId: number, amount: number, transactionType: string): Promise<APIResponse<{ isValid: boolean; errors: string[] }>>;
}

