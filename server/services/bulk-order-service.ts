/**
 * Bulk Order Service
 * Handles bulk order submission and processing
 */

import { z } from 'zod';
import { createOrder, OrderRecord } from './order-service';
import type { OrderFormData } from '@shared/types/order-management.types';

// Bulk order batch status
export type BulkOrderBatchStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'partial';

// Bulk order item result
export interface BulkOrderItemResult {
  index: number;
  orderId?: number;
  modelOrderId?: string;
  success: boolean;
  error?: string;
  order?: OrderRecord;
}

// Bulk order batch
export interface BulkOrderBatch {
  batchId: string;
  userId: number;
  status: BulkOrderBatchStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  orders: OrderRecord[];
  results: BulkOrderItemResult[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Bulk order request schema
const bulkOrderRequestSchema = z.object({
  orders: z.array(z.any()).min(1).max(100), // OrderFormData array
  options: z.object({
    stopOnError: z.boolean().default(false),
    validateOnly: z.boolean().default(false),
  }).optional(),
});

export type BulkOrderRequest = z.infer<typeof bulkOrderRequestSchema>;

// In-memory storage (replace with database in production)
const batches: Map<string, BulkOrderBatch> = new Map();

/**
 * Generate batch ID
 */
function generateBatchId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `BATCH-${dateStr}-${randomStr}`;
}

/**
 * Validate order form data
 */
function validateOrderFormData(orderData: any): { valid: boolean; error?: string } {
  if (!orderData.cartItems || !Array.isArray(orderData.cartItems) || orderData.cartItems.length === 0) {
    return { valid: false, error: 'Cart items are required' };
  }

  if (!orderData.transactionMode || !orderData.transactionMode.mode) {
    return { valid: false, error: 'Transaction mode is required' };
  }

  // Validate nominees if not opted out
  if (!orderData.optOutOfNomination) {
    if (!orderData.nominees || orderData.nominees.length === 0) {
      return { valid: false, error: 'Nominee information is required' };
    }

    const totalPercentage = orderData.nominees.reduce(
      (sum: number, n: any) => sum + (n.percentage || 0),
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return { valid: false, error: `Nominee percentages must total 100%. Current: ${totalPercentage}%` };
    }
  }

  return { valid: true };
}

/**
 * Process a single order
 */
async function processOrder(
  orderData: OrderFormData,
  userId: number,
  index: number,
  ipAddress?: string
): Promise<BulkOrderItemResult> {
  try {
    // Validate order
    const validation = validateOrderFormData(orderData);
    if (!validation.valid) {
      return {
        index,
        success: false,
        error: validation.error,
      };
    }

    // Generate Model Order ID
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const modelOrderId = `MO-${dateStr}-${randomStr}`;
    const traceId = `TRACE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create order
    const order = await createOrder({
      modelOrderId,
      clientId: userId,
      orderFormData: orderData,
      status: 'Pending Approval',
      ipAddress: ipAddress || 'unknown',
      traceId,
    });

    return {
      index,
      orderId: order.id,
      modelOrderId: order.modelOrderId,
      success: true,
      order,
    };
  } catch (error: any) {
    return {
      index,
      success: false,
      error: error.message || 'Failed to process order',
    };
  }
}

/**
 * Create bulk order batch
 */
export async function createBulkOrderBatch(
  userId: number,
  request: BulkOrderRequest,
  ipAddress?: string
): Promise<BulkOrderBatch> {
  // Validate request
  const validation = bulkOrderRequestSchema.safeParse(request);
  if (!validation.success) {
    throw new Error(`Invalid bulk order request: ${validation.error.message}`);
  }

  const options = request.options || {
    stopOnError: false,
    validateOnly: false,
  };

  const batchId = generateBatchId();
  const batch: BulkOrderBatch = {
    batchId,
    userId,
    status: 'pending',
    total: request.orders.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    orders: [],
    results: [],
    createdAt: new Date().toISOString(),
  };

  batches.set(batchId, batch);

  // Process orders asynchronously
  processBulkOrderBatch(batch, request, ipAddress).catch((error) => {
    console.error(`Error processing bulk order batch ${batchId}:`, error);
    batch.status = 'failed';
    batch.error = error.message;
    batch.completedAt = new Date().toISOString();
    batches.set(batchId, batch);
  });

  return batch;
}

/**
 * Process bulk order batch
 */
async function processBulkOrderBatch(
  batch: BulkOrderBatch,
  request: BulkOrderRequest,
  ipAddress?: string
): Promise<void> {
  batch.status = 'processing';
  batches.set(batch.batchId, batch);

  const options = request.options || {
    stopOnError: false,
    validateOnly: false,
  };

  for (let i = 0; i < request.orders.length; i++) {
    const orderData = request.orders[i];

    // If validate only, skip actual order creation
    if (options.validateOnly) {
      const validation = validateOrderFormData(orderData);
      const result: BulkOrderItemResult = {
        index: i,
        success: validation.valid,
        error: validation.error,
      };
      batch.results.push(result);
      batch.processed++;
      if (validation.valid) {
        batch.succeeded++;
      } else {
        batch.failed++;
        if (options.stopOnError) {
          break;
        }
      }
      continue;
    }

    // Process order
    const result = await processOrder(orderData, batch.userId, i, ipAddress);
    batch.results.push(result);
    batch.processed++;

    if (result.success && result.order) {
      batch.succeeded++;
      batch.orders.push(result.order);
    } else {
      batch.failed++;
      if (options.stopOnError) {
        batch.status = 'failed';
        batch.error = `Stopped on error at index ${i}: ${result.error}`;
        break;
      }
    }

    // Update batch status
    batches.set(batch.batchId, batch);

    // Small delay to prevent overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Finalize batch
  if (batch.status !== 'failed') {
    if (batch.failed === 0) {
      batch.status = 'completed';
    } else if (batch.succeeded > 0) {
      batch.status = 'partial';
    } else {
      batch.status = 'failed';
    }
  }

  batch.completedAt = new Date().toISOString();
  batches.set(batch.batchId, batch);
}

/**
 * Get bulk order batch by ID
 */
export async function getBulkOrderBatch(
  batchId: string,
  userId: number
): Promise<BulkOrderBatch | null> {
  const batch = batches.get(batchId);
  if (!batch || batch.userId !== userId) {
    return null;
  }
  return batch;
}

/**
 * Get all bulk order batches for a user
 */
export async function getUserBulkOrderBatches(
  userId: number,
  limit: number = 50
): Promise<BulkOrderBatch[]> {
  return Array.from(batches.values())
    .filter((batch) => batch.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

