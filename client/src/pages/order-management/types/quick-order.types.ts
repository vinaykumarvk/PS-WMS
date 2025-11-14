/**
 * Quick Order Placement Type Definitions
 * Module A: Quick Order Placement
 */

import { Product, CartItem } from './order.types';

export interface Favorite {
  id: string;
  productId: number;
  schemeName: string;
  schemeCode?: string;
  addedAt: string;
  product?: Product; // Full product details when available
}

export interface RecentOrder {
  id: string;
  orderId: number;
  modelOrderId: string;
  productId: number;
  schemeName: string;
  transactionType: string;
  amount: number;
  orderDate: string;
  status: string;
  product?: Product; // Full product details when available
}

export interface QuickOrderRequest {
  productId: number;
  amount: number;
  transactionType?: 'Purchase' | 'Redemption' | 'Switch';
  orderType?: 'Initial Purchase' | 'Additional Purchase';
  sourceSchemeId?: number; // For switch transactions
}

export interface QuickOrderResponse {
  success: boolean;
  message: string;
  data?: {
    cartItem: CartItem;
    orderId?: number;
  };
  errors?: string[];
}

export type AmountPreset = 5000 | 10000 | 25000 | 50000 | 100000;

export const AMOUNT_PRESETS: AmountPreset[] = [5000, 10000, 25000, 50000, 100000];

