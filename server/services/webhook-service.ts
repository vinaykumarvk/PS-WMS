/**
 * Webhook Service
 * Handles webhook registration, delivery, and management
 */

import crypto from 'crypto';
import { z } from 'zod';

// Webhook event types
export type WebhookEvent = 
  | 'order.created'
  | 'order.updated'
  | 'order.completed'
  | 'order.failed'
  | 'payment.received'
  | 'payment.failed';

// Webhook status
export type WebhookStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

// Webhook schema
const webhookSchema = z.object({
  id: z.string(),
  userId: z.number(),
  url: z.string().url(),
  events: z.array(z.enum([
    'order.created',
    'order.updated',
    'order.completed',
    'order.failed',
    'payment.received',
    'payment.failed',
  ])),
  secret: z.string(),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastTriggeredAt: z.string().optional(),
  failureCount: z.number().default(0),
});

export type Webhook = z.infer<typeof webhookSchema>;

// Webhook delivery record
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: WebhookStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
}

// In-memory storage (replace with database in production)
const webhooks: Map<string, Webhook> = new Map();
const deliveries: Map<string, WebhookDelivery> = new Map();

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  userId: number,
  data: {
    url: string;
    events: WebhookEvent[];
    secret?: string;
  }
): Promise<Webhook> {
  // Validate URL
  try {
    new URL(data.url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  // Validate events
  if (data.events.length === 0) {
    throw new Error('At least one event type is required');
  }

  // Generate secret if not provided
  const secret = data.secret || crypto.randomBytes(32).toString('hex');

  const webhook: Webhook = {
    id: `wh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    url: data.url,
    events: data.events,
    secret,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    failureCount: 0,
  };

  webhooks.set(webhook.id, webhook);
  return webhook;
}

/**
 * Get webhook by ID
 */
export async function getWebhookById(
  webhookId: string,
  userId: number
): Promise<Webhook | null> {
  const webhook = webhooks.get(webhookId);
  if (!webhook || webhook.userId !== userId) {
    return null;
  }
  return webhook;
}

/**
 * Get all webhooks for a user
 */
export async function getUserWebhooks(userId: number): Promise<Webhook[]> {
  return Array.from(webhooks.values()).filter(
    (wh) => wh.userId === userId
  );
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  userId: number,
  updates: {
    url?: string;
    events?: WebhookEvent[];
    active?: boolean;
  }
): Promise<Webhook> {
  const webhook = await getWebhookById(webhookId, userId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
    webhook.url = updates.url;
  }

  if (updates.events) {
    if (updates.events.length === 0) {
      throw new Error('At least one event type is required');
    }
    webhook.events = updates.events;
  }

  if (updates.active !== undefined) {
    webhook.active = updates.active;
  }

  webhook.updatedAt = new Date().toISOString();
  webhooks.set(webhook.id, webhook);

  return webhook;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(
  webhookId: string,
  userId: number
): Promise<boolean> {
  const webhook = await getWebhookById(webhookId, userId);
  if (!webhook) {
    return false;
  }

  webhooks.delete(webhookId);
  return true;
}

/**
 * Deliver webhook event
 */
export async function deliverWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  payload: any
): Promise<WebhookDelivery> {
  if (!webhook.active) {
    throw new Error('Webhook is not active');
  }

  if (!webhook.events.includes(event)) {
    throw new Error(`Webhook does not subscribe to event: ${event}`);
  }

  const deliveryId = `del_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, webhook.secret);

  const delivery: WebhookDelivery = {
    id: deliveryId,
    webhookId: webhook.id,
    event,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Id': webhook.id,
        'X-Webhook-Timestamp': Date.now().toString(),
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    delivery.attempts = 1;
    delivery.lastAttemptAt = new Date().toISOString();
    delivery.responseCode = response.status;
    delivery.responseBody = await response.text().catch(() => undefined);

    if (response.ok) {
      delivery.status = 'delivered';
      webhook.lastTriggeredAt = new Date().toISOString();
      webhook.failureCount = 0;
    } else {
      delivery.status = 'failed';
      delivery.error = `HTTP ${response.status}: ${delivery.responseBody}`;
      webhook.failureCount += 1;
    }

    webhook.updatedAt = new Date().toISOString();
    webhooks.set(webhook.id, webhook);
  } catch (error: any) {
    delivery.attempts = 1;
    delivery.status = 'failed';
    delivery.error = error.message;
    delivery.lastAttemptAt = new Date().toISOString();
    webhook.failureCount += 1;
    webhook.updatedAt = new Date().toISOString();
    webhooks.set(webhook.id, webhook);
  }

  deliveries.set(deliveryId, delivery);
  return delivery;
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  userId: number,
  event: WebhookEvent,
  payload: any
): Promise<void> {
  const userWebhooks = await getUserWebhooks(userId);
  const relevantWebhooks = userWebhooks.filter(
    (wh) => wh.active && wh.events.includes(event)
  );

  // Deliver webhooks in parallel
  await Promise.allSettled(
    relevantWebhooks.map((webhook) =>
      deliverWebhook(webhook, event, payload).catch((error) => {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error);
      })
    )
  );
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
  webhookId: string,
  userId: number,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const webhook = await getWebhookById(webhookId, userId);
  if (!webhook) {
    return [];
  }

  return Array.from(deliveries.values())
    .filter((del) => del.webhookId === webhookId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempts: number, baseDelay: number = 1000): number {
  // Exponential backoff: baseDelay * 2^(attempts - 1)
  // Max delay: 5 minutes
  const maxDelay = 5 * 60 * 1000;
  const delay = baseDelay * Math.pow(2, attempts - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry failed webhook delivery with exponential backoff
 */
export async function retryWebhookDelivery(
  deliveryId: string,
  userId: number,
  maxRetries: number = 5
): Promise<WebhookDelivery> {
  const delivery = deliveries.get(deliveryId);
  if (!delivery) {
    throw new Error('Delivery not found');
  }

  const webhook = await getWebhookById(delivery.webhookId, userId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  if (delivery.attempts >= maxRetries) {
    delivery.status = 'failed';
    delivery.error = `Max retries (${maxRetries}) exceeded`;
    deliveries.set(deliveryId, delivery);
    return delivery;
  }

  // Calculate backoff delay
  const delay = calculateBackoffDelay(delivery.attempts);
  
  // Wait before retry
  await new Promise(resolve => setTimeout(resolve, delay));

  const updatedDelivery = await deliverWebhook(
    webhook,
    delivery.event,
    delivery.payload
  );

  // Update delivery record
  updatedDelivery.id = deliveryId;
  updatedDelivery.attempts = delivery.attempts + 1;
  updatedDelivery.nextRetryAt = updatedDelivery.status === 'failed' && updatedDelivery.attempts < maxRetries
    ? new Date(Date.now() + calculateBackoffDelay(updatedDelivery.attempts)).toISOString()
    : undefined;
  
  deliveries.set(deliveryId, updatedDelivery);

  return updatedDelivery;
}

/**
 * Retry all failed webhook deliveries for a webhook
 */
export async function retryFailedDeliveries(
  webhookId: string,
  userId: number,
  maxRetries: number = 5
): Promise<WebhookDelivery[]> {
  const webhook = await getWebhookById(webhookId, userId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  const failedDeliveries = Array.from(deliveries.values())
    .filter(del => del.webhookId === webhookId && del.status === 'failed' && del.attempts < maxRetries);

  const results: WebhookDelivery[] = [];
  
  for (const delivery of failedDeliveries) {
    try {
      const retried = await retryWebhookDelivery(delivery.id, userId, maxRetries);
      results.push(retried);
    } catch (error: any) {
      console.error(`Failed to retry delivery ${delivery.id}:`, error);
    }
  }

  return results;
}

