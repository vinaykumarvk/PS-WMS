/**
 * Integration Service
 * Manages partner integrations and API access
 */

import crypto from 'crypto';
import { z } from 'zod';

// Integration types
export type IntegrationType = 
  | 'payment_gateway'
  | 'rta'
  | 'nav_provider'
  | 'email_service'
  | 'sms_service'
  | 'analytics'
  | 'custom';

// Integration status
export type IntegrationStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// Integration schema
const integrationSchema = z.object({
  id: z.string(),
  userId: z.number(),
  name: z.string(),
  type: z.enum([
    'payment_gateway',
    'rta',
    'nav_provider',
    'email_service',
    'sms_service',
    'analytics',
    'custom',
  ]),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('pending'),
  apiKey: z.string(),
  apiSecret: z.string(),
  config: z.record(z.any()).optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsedAt: z.string().optional(),
  usageCount: z.number().default(0),
});

export type Integration = z.infer<typeof integrationSchema>;

// Integration usage log
export interface IntegrationUsage {
  id: string;
  integrationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  error?: string;
}

// In-memory storage (replace with database in production)
const integrations: Map<string, Integration> = new Map();
const usageLogs: Map<string, IntegrationUsage[]> = new Map();

/**
 * Generate API key
 */
function generateApiKey(): string {
  return `ak_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate API secret
 */
function generateApiSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new integration
 */
export async function createIntegration(
  userId: number,
  data: {
    name: string;
    type: IntegrationType;
    config?: Record<string, any>;
    webhookUrl?: string;
  }
): Promise<Integration> {
  // Validate webhook URL if provided
  if (data.webhookUrl) {
    try {
      new URL(data.webhookUrl);
    } catch {
      throw new Error('Invalid webhook URL');
    }
  }

  const integration: Integration = {
    id: `int_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    userId,
    name: data.name,
    type: data.type,
    status: 'pending',
    apiKey: generateApiKey(),
    apiSecret: generateApiSecret(),
    config: data.config || {},
    webhookUrl: data.webhookUrl,
    webhookSecret: data.webhookUrl ? crypto.randomBytes(32).toString('hex') : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };

  integrations.set(integration.id, integration);
  return integration;
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(
  integrationId: string,
  userId: number
): Promise<Integration | null> {
  const integration = integrations.get(integrationId);
  if (!integration || integration.userId !== userId) {
    return null;
  }
  return integration;
}

/**
 * Get integration by API key
 */
export async function getIntegrationByApiKey(
  apiKey: string
): Promise<Integration | null> {
  for (const integration of integrations.values()) {
    if (integration.apiKey === apiKey) {
      return integration;
    }
  }
  return null;
}

/**
 * Get all integrations for a user
 */
export async function getUserIntegrations(
  userId: number,
  type?: IntegrationType
): Promise<Integration[]> {
  let userIntegrations = Array.from(integrations.values()).filter(
    (int) => int.userId === userId
  );

  if (type) {
    userIntegrations = userIntegrations.filter((int) => int.type === type);
  }

  return userIntegrations;
}

/**
 * Update integration
 */
export async function updateIntegration(
  integrationId: string,
  userId: number,
  updates: {
    name?: string;
    status?: IntegrationStatus;
    config?: Record<string, any>;
    webhookUrl?: string;
  }
): Promise<Integration> {
  const integration = await getIntegrationById(integrationId, userId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  if (updates.name) {
    integration.name = updates.name;
  }

  if (updates.status) {
    integration.status = updates.status;
  }

  if (updates.config) {
    integration.config = { ...integration.config, ...updates.config };
  }

  if (updates.webhookUrl !== undefined) {
    if (updates.webhookUrl) {
      try {
        new URL(updates.webhookUrl);
        integration.webhookUrl = updates.webhookUrl;
        if (!integration.webhookSecret) {
          integration.webhookSecret = crypto.randomBytes(32).toString('hex');
        }
      } catch {
        throw new Error('Invalid webhook URL');
      }
    } else {
      integration.webhookUrl = undefined;
      integration.webhookSecret = undefined;
    }
  }

  integration.updatedAt = new Date().toISOString();
  integrations.set(integration.id, integration);

  return integration;
}

/**
 * Regenerate API credentials
 */
export async function regenerateApiCredentials(
  integrationId: string,
  userId: number
): Promise<{ apiKey: string; apiSecret: string }> {
  const integration = await getIntegrationById(integrationId, userId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  integration.apiKey = generateApiKey();
  integration.apiSecret = generateApiSecret();
  integration.updatedAt = new Date().toISOString();
  integrations.set(integration.id, integration);

  return {
    apiKey: integration.apiKey,
    apiSecret: integration.apiSecret,
  };
}

/**
 * Delete integration
 */
export async function deleteIntegration(
  integrationId: string,
  userId: number
): Promise<boolean> {
  const integration = await getIntegrationById(integrationId, userId);
  if (!integration) {
    return false;
  }

  integrations.delete(integrationId);
  usageLogs.delete(integrationId);
  return true;
}

/**
 * Log integration usage
 */
export async function logIntegrationUsage(
  integrationId: string,
  usage: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    error?: string;
  }
): Promise<void> {
  const integration = integrations.get(integrationId);
  if (!integration) {
    return;
  }

  const logEntry: IntegrationUsage = {
    id: `log_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    integrationId,
    ...usage,
    timestamp: new Date().toISOString(),
  };

  const logs = usageLogs.get(integrationId) || [];
  logs.push(logEntry);
  
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.shift();
  }
  
  usageLogs.set(integrationId, logs);

  // Update integration stats
  integration.usageCount += 1;
  integration.lastUsedAt = new Date().toISOString();
  integrations.set(integrationId, integration);
}

/**
 * Get integration usage logs
 */
export async function getIntegrationUsageLogs(
  integrationId: string,
  userId: number,
  limit: number = 100
): Promise<IntegrationUsage[]> {
  const integration = await getIntegrationById(integrationId, userId);
  if (!integration) {
    return [];
  }

  const logs = usageLogs.get(integrationId) || [];
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Verify API key and secret
 */
export async function verifyApiCredentials(
  apiKey: string,
  apiSecret: string
): Promise<Integration | null> {
  const integration = await getIntegrationByApiKey(apiKey);
  if (!integration) {
    return null;
  }

  if (integration.apiSecret !== apiSecret) {
    return null;
  }

  if (integration.status !== 'active') {
    return null;
  }

  return integration;
}

