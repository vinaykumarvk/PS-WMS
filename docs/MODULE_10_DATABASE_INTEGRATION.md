# Module 10: Database Integration Guide

This guide provides instructions for migrating Module 10 services from in-memory storage to database-backed storage.

---

## Overview

Currently, Module 10 services use in-memory storage (Map objects) for development. For production, these should be migrated to use PostgreSQL/Supabase database.

---

## Database Schema

### Webhooks Table

```sql
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(active) WHERE active = true;
```

### Webhook Deliveries Table

```sql
CREATE TABLE webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  response_code INTEGER,
  response_body TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;
```

### Bulk Order Batches Table

```sql
CREATE TABLE bulk_order_batches (
  batch_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bulk_order_batches_user_id ON bulk_order_batches(user_id);
CREATE INDEX idx_bulk_order_batches_status ON bulk_order_batches(status);
```

### Bulk Order Results Table

```sql
CREATE TABLE bulk_order_results (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES bulk_order_batches(batch_id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  order_id INTEGER REFERENCES orders(id),
  model_order_id TEXT,
  success BOOLEAN NOT NULL,
  error TEXT,
  order_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, order_index)
);

CREATE INDEX idx_bulk_order_results_batch_id ON bulk_order_results(batch_id);
```

### Integrations Table

```sql
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  config JSONB,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_api_key ON integrations(api_key);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
```

### Integration Usage Logs Table

```sql
CREATE TABLE integration_usage_logs (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_usage_logs_integration_id ON integration_usage_logs(integration_id);
CREATE INDEX idx_integration_usage_logs_timestamp ON integration_usage_logs(timestamp DESC);
```

---

## Migration Steps

### 1. Update Webhook Service

Replace in-memory storage with database queries:

```typescript
// server/services/webhook-service.ts

import { db } from '../db';
import { webhooks, webhookDeliveries } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function createWebhook(
  userId: number,
  data: { url: string; events: WebhookEvent[]; secret?: string }
): Promise<Webhook> {
  const secret = data.secret || crypto.randomBytes(32).toString('hex');
  const webhookId = `wh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  const [webhook] = await db.insert(webhooks).values({
    id: webhookId,
    userId,
    url: data.url,
    events: data.events,
    secret,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    failureCount: 0,
  }).returning();

  return webhook;
}

export async function getUserWebhooks(userId: number): Promise<Webhook[]> {
  return await db.select()
    .from(webhooks)
    .where(eq(webhooks.userId, userId))
    .orderBy(desc(webhooks.createdAt));
}

// Similar updates for other functions...
```

### 2. Update Bulk Order Service

```typescript
// server/services/bulk-order-service.ts

import { db } from '../db';
import { bulkOrderBatches, bulkOrderResults } from '@shared/schema';

export async function createBulkOrderBatch(
  userId: number,
  request: BulkOrderRequest,
  ipAddress?: string
): Promise<BulkOrderBatch> {
  const batchId = generateBatchId();

  const [batch] = await db.insert(bulkOrderBatches).values({
    batchId,
    userId,
    status: 'pending',
    total: request.orders.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    createdAt: new Date().toISOString(),
  }).returning();

  // Process orders asynchronously
  processBulkOrderBatch(batch, request, ipAddress).catch((error) => {
    console.error(`Error processing bulk order batch ${batchId}:`, error);
    // Update batch status to failed
  });

  return batch;
}
```

### 3. Update Integration Service

```typescript
// server/services/integration-service.ts

import { db } from '../db';
import { integrations, integrationUsageLogs } from '@shared/schema';

export async function createIntegration(
  userId: number,
  data: { name: string; type: IntegrationType; config?: Record<string, any>; webhookUrl?: string }
): Promise<Integration> {
  const integrationId = `int_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const apiKey = generateApiKey();
  const apiSecret = generateApiSecret();

  const [integration] = await db.insert(integrations).values({
    id: integrationId,
    userId,
    name: data.name,
    type: data.type,
    status: 'pending',
    apiKey,
    apiSecret,
    config: data.config || {},
    webhookUrl: data.webhookUrl,
    webhookSecret: data.webhookUrl ? crypto.randomBytes(32).toString('hex') : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  }).returning();

  return integration;
}
```

---

## Drizzle Schema Definitions

Add to `shared/schema.ts`:

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const webhookEventsEnum = pgEnum('webhook_event', [
  'order.created',
  'order.updated',
  'order.completed',
  'order.failed',
  'payment.received',
  'payment.failed',
]);

export const webhookStatusEnum = pgEnum('webhook_status', [
  'pending',
  'delivered',
  'failed',
  'retrying',
]);

export const bulkOrderBatchStatusEnum = pgEnum('bulk_order_batch_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'partial',
]);

export const integrationTypeEnum = pgEnum('integration_type', [
  'payment_gateway',
  'rta',
  'nav_provider',
  'email_service',
  'sms_service',
  'analytics',
  'custom',
]);

export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'inactive',
  'pending',
  'suspended',
]);

export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: webhookEventsEnum('events').array().notNull(),
  secret: text('secret').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  failureCount: integer('failure_count').notNull().default(0),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: webhookEventsEnum('event').notNull(),
  payload: jsonb('payload').notNull(),
  status: webhookStatusEnum('status').notNull(),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  responseCode: integer('response_code'),
  responseBody: text('response_body'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bulkOrderBatches = pgTable('bulk_order_batches', {
  batchId: text('batch_id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: bulkOrderBatchStatusEnum('status').notNull().default('pending'),
  total: integer('total').notNull(),
  processed: integer('processed').notNull().default(0),
  succeeded: integer('succeeded').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const bulkOrderResults = pgTable('bulk_order_results', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  batchId: text('batch_id').notNull().references(() => bulkOrderBatches.batchId, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  orderId: integer('order_id').references(() => orders.id),
  modelOrderId: text('model_order_id'),
  success: boolean('success').notNull(),
  error: text('error'),
  orderData: jsonb('order_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: integrationTypeEnum('type').notNull(),
  status: integrationStatusEnum('status').notNull().default('pending'),
  apiKey: text('api_key').notNull().unique(),
  apiSecret: text('api_secret').notNull(),
  config: jsonb('config'),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').notNull().default(0),
});

export const integrationUsageLogs = pgTable('integration_usage_logs', {
  id: text('id').primaryKey(),
  integrationId: text('integration_id').notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time').notNull(),
  error: text('error'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Background Jobs

### Webhook Retry Job

Create a background job to retry failed webhook deliveries:

```typescript
// server/services/webhook-retry-job.ts

import { db } from '../db';
import { webhookDeliveries, webhooks } from '@shared/schema';
import { eq, lte } from 'drizzle-orm';
import { retryWebhookDelivery } from './webhook-service';

export async function processWebhookRetries() {
  const now = new Date().toISOString();
  
  // Find deliveries that need retry
  const deliveriesToRetry = await db.select()
    .from(webhookDeliveries)
    .where(
      and(
        eq(webhookDeliveries.status, 'failed'),
        lte(webhookDeliveries.nextRetryAt, now)
      )
    )
    .limit(100);

  for (const delivery of deliveriesToRetry) {
    try {
      const webhook = await db.select()
        .from(webhooks)
        .where(eq(webhooks.id, delivery.webhookId))
        .limit(1);

      if (webhook[0] && webhook[0].active) {
        await retryWebhookDelivery(delivery.id, webhook[0].userId);
      }
    } catch (error) {
      console.error(`Failed to retry webhook delivery ${delivery.id}:`, error);
    }
  }
}

// Run every 5 minutes
setInterval(processWebhookRetries, 5 * 60 * 1000);
```

---

## Migration Checklist

- [ ] Create database tables using SQL schema above
- [ ] Add Drizzle schema definitions to `shared/schema.ts`
- [ ] Update webhook service to use database
- [ ] Update bulk order service to use database
- [ ] Update integration service to use database
- [ ] Create background job for webhook retries
- [ ] Update tests to use test database
- [ ] Run database migrations
- [ ] Test all endpoints with database
- [ ] Monitor performance and optimize queries

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried fields are indexed
2. **Pagination**: Use limit/offset for large result sets
3. **Connection Pooling**: Use connection pooling for database connections
4. **Caching**: Consider caching frequently accessed webhooks/integrations
5. **Background Processing**: Use job queues for webhook delivery and bulk order processing

---

## Security Considerations

1. **Secrets**: Store API secrets encrypted in database
2. **Access Control**: Ensure users can only access their own webhooks/integrations
3. **Rate Limiting**: Implement rate limiting at database level
4. **Audit Logging**: Log all integration usage for security auditing

---

**Last Updated:** January 2025

