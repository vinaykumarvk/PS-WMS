/**
 * Notification Service
 * Enhanced notification service for automation features
 * Module 11: Automation Features - Sub-module 11.4
 */

import type {
  NotificationPreference,
  CreateNotificationPreferenceInput,
  NotificationLog,
  NotificationChannel,
  NotificationEvent,
} from '@shared/types/automation.types';
import { supabaseServer } from '../lib/supabase';
import { getIntegrationConfig, createIntegrationInstances } from '../integrations/config';

// Initialize providers from integration config
let emailProvider: any = null;
let smsProvider: any = null;

function getEmailProvider() {
  if (!emailProvider) {
    const config = getIntegrationConfig();
    const instances = createIntegrationInstances(config);
    emailProvider = instances.emailProvider;
  }
  return emailProvider;
}

function getSMSProvider() {
  if (!smsProvider) {
    const config = getIntegrationConfig();
    const instances = createIntegrationInstances(config);
    smsProvider = instances.smsProvider;
  }
  return smsProvider;
}

// ============================================================================
// Notification Preferences
// ============================================================================

function generateId(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Create a notification preference
 */
export async function createNotificationPreference(
  input: CreateNotificationPreferenceInput
): Promise<NotificationPreference> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const prefId = generateId('NOTIF-PREF');

  const prefData = {
    id: prefId,
    client_id: input.clientId,
    user_id: input.userId || null,
    event: input.event,
    channels: input.channels,
    enabled: input.enabled,
    quiet_hours: input.quietHours || null,
    min_amount: input.minAmount || null,
    schemes: input.schemes || null,
  };

  const { data: preference, error } = await supabaseServer
    .from('notification_preferences')
    .insert(prefData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification preference: ${error.message}`);
  }

  return mapNotificationPreferenceFromDB(preference);
}

/**
 * Get notification preferences for a client/user
 */
export async function getNotificationPreferences(
  clientId: number,
  userId?: number
): Promise<NotificationPreference[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  let query = supabaseServer
    .from('notification_preferences')
    .select('*')
    .eq('client_id', clientId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.is('user_id', null);
  }

  const { data: preferences, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notification preferences: ${error.message}`);
  }

  return (preferences || []).map(mapNotificationPreferenceFromDB);
}

/**
 * Update a notification preference
 */
export async function updateNotificationPreference(
  prefId: string,
  updates: Partial<CreateNotificationPreferenceInput>
): Promise<NotificationPreference> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.event !== undefined) updateData.event = updates.event;
  if (updates.channels !== undefined) updateData.channels = updates.channels;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.quietHours !== undefined) updateData.quiet_hours = updates.quietHours;
  if (updates.minAmount !== undefined) updateData.min_amount = updates.minAmount;
  if (updates.schemes !== undefined) updateData.schemes = updates.schemes;

  const { data: preference, error } = await supabaseServer
    .from('notification_preferences')
    .update(updateData)
    .eq('id', prefId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update notification preference: ${error.message}`);
  }

  return mapNotificationPreferenceFromDB(preference);
}

/**
 * Delete a notification preference
 */
export async function deleteNotificationPreference(prefId: string): Promise<void> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { error } = await supabaseServer
    .from('notification_preferences')
    .delete()
    .eq('id', prefId);

  if (error) {
    throw new Error(`Failed to delete notification preference: ${error.message}`);
  }
}

// ============================================================================
// Notification Sending
// ============================================================================

/**
 * Send notification based on event and preferences
 */
export async function sendNotification(
  clientId: number,
  event: NotificationEvent,
  data: {
    subject?: string;
    message: string;
    amount?: number;
    schemeId?: number;
    orderId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  // Get preferences for this event
  const preferences = await getNotificationPreferences(clientId);
  const eventPreferences = preferences.filter(
    (p) => p.event === event && p.enabled
  );

  if (eventPreferences.length === 0) {
    console.log(`No notification preferences found for event: ${event}`);
    return;
  }

  // Check filters
  const applicablePreferences = eventPreferences.filter((pref) => {
    if (pref.minAmount && data.amount && data.amount < pref.minAmount) {
      return false;
    }
    if (pref.schemes && pref.schemes.length > 0 && data.schemeId && !pref.schemes.includes(data.schemeId)) {
      return false;
    }
    return true;
  });

  if (applicablePreferences.length === 0) {
    console.log(`No applicable notification preferences for event: ${event}`);
    return;
  }

  // Check quiet hours
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  for (const preference of applicablePreferences) {
    if (preference.quietHours) {
      const { start, end } = preference.quietHours;
      if (isInQuietHours(currentTime, start, end)) {
        console.log(`Skipping notification due to quiet hours: ${currentTime}`);
        continue;
      }
    }

    // Send via each enabled channel
    for (const channel of preference.channels) {
      try {
        await sendNotificationViaChannel(
          clientId,
          channel,
          event,
          data.subject || getDefaultSubject(event),
          data.message,
          data.metadata
        );

        // Log successful notification
        await logNotification({
          clientId,
          event,
          channel,
          status: 'Sent',
          metadata: data.metadata,
        });
      } catch (error: any) {
        console.error(`Failed to send ${channel} notification:`, error);
        
        // Log failed notification
        await logNotification({
          clientId,
          event,
          channel,
          status: 'Failed',
          error: error.message,
          metadata: data.metadata,
        });
      }
    }
  }
}

/**
 * Send notification via specific channel
 */
async function sendNotificationViaChannel(
  clientId: number,
  channel: NotificationChannel,
  event: NotificationEvent,
  subject: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Get client contact info
  const client = await getClientContactInfo(clientId);
  if (!client) {
    throw new Error('Client not found');
  }

  switch (channel) {
    case 'Email':
      await sendEmailNotification(client.email, subject, message);
      break;
    case 'SMS':
      await sendSMSNotification(client.phone, message);
      break;
    case 'Push':
      // Push notifications would be handled by a push service
      console.log(`Push notification: ${subject} - ${message}`);
      break;
    case 'In-App':
      // In-app notifications would be stored in database for real-time delivery
      await storeInAppNotification(clientId, event, subject, message, metadata);
      break;
    default:
      throw new Error(`Unsupported notification channel: ${channel}`);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  subject: string,
  message: string
): Promise<void> {
  try {
    const emailProvider = getEmailProvider();
    await emailProvider.sendEmail({
      to: email,
      subject,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${message.replace(/\n/g, '<br>')}</div>`,
      text: message,
    });
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(phone: string, message: string): Promise<void> {
  try {
    const smsProvider = getSMSProvider();
    await smsProvider.sendSMS({
      to: phone,
      message,
    });
  } catch (error: any) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Store in-app notification
 */
async function storeInAppNotification(
  clientId: number,
  event: NotificationEvent,
  subject: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (!supabaseServer) return;

  const notifId = generateId('NOTIF');

  await supabaseServer
    .from('in_app_notifications')
    .insert({
      id: notifId,
      client_id: clientId,
      event,
      subject,
      message,
      metadata: metadata || {},
      read: false,
      created_at: new Date().toISOString(),
    });
}

/**
 * Get client contact information
 */
async function getClientContactInfo(clientId: number): Promise<{ email: string; phone: string } | null> {
  if (!supabaseServer) {
    return null;
  }

  const { data: client, error } = await supabaseServer
    .from('clients')
    .select('email, phone')
    .eq('id', clientId)
    .single();

  if (error || !client) {
    return null;
  }

  return {
    email: client.email || `client${clientId}@example.com`,
    phone: client.phone || '+919876543210',
  };
}

/**
 * Get default subject for event
 */
function getDefaultSubject(event: NotificationEvent): string {
  const subjects: Record<NotificationEvent, string> = {
    'Order Submitted': 'Order Submitted Successfully',
    'Order Executed': 'Order Executed',
    'Order Failed': 'Order Execution Failed',
    'Order Settled': 'Order Settled',
    'Auto-Invest Executed': 'Auto-Invest Executed',
    'Auto-Invest Failed': 'Auto-Invest Failed',
    'Rebalancing Triggered': 'Portfolio Rebalancing Triggered',
    'Rebalancing Executed': 'Portfolio Rebalanced',
    'Trigger Order Activated': 'Trigger Order Activated',
    'Goal Milestone Reached': 'Goal Milestone Reached',
    'Portfolio Alert': 'Portfolio Alert',
    'Market Update': 'Market Update',
  };

  return subjects[event] || 'Notification';
}

/**
 * Check if current time is in quiet hours
 */
function isInQuietHours(currentTime: string, start: string, end: string): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const current = currentHour * 60 + currentMin;
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    // Normal case: start < end (e.g., 22:00 - 08:00)
    return current >= startTime && current <= endTime;
  } else {
    // Overnight case: start > end (e.g., 22:00 - 08:00)
    return current >= startTime || current <= endTime;
  }
}

// ============================================================================
// Notification Logging
// ============================================================================

/**
 * Log notification
 */
async function logNotification(log: {
  clientId: number;
  userId?: number;
  event: NotificationEvent;
  channel: NotificationChannel;
  status: 'Sent' | 'Failed' | 'Pending';
  error?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  if (!supabaseServer) return;

  const logId = generateId('NOTIF-LOG');

  await supabaseServer
    .from('notification_logs')
    .insert({
      id: logId,
      client_id: log.clientId,
      user_id: log.userId || null,
      event: log.event,
      channel: log.channel,
      status: log.status,
      sent_at: log.status === 'Sent' ? new Date().toISOString() : null,
      error: log.error || null,
      metadata: log.metadata || {},
    });
}

/**
 * Get notification logs
 */
export async function getNotificationLogs(
  clientId: number,
  event?: NotificationEvent,
  channel?: NotificationChannel,
  limit: number = 100
): Promise<NotificationLog[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  let query = supabaseServer
    .from('notification_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (event) {
    query = query.eq('event', event);
  }
  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data: logs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notification logs: ${error.message}`);
  }

  return (logs || []).map((log: any) => ({
    id: log.id,
    clientId: log.client_id,
    userId: log.user_id,
    event: log.event,
    channel: log.channel,
    status: log.status,
    sentAt: log.sent_at,
    error: log.error,
    metadata: log.metadata || {},
  }));
}

// ============================================================================
// Database Mapping
// ============================================================================

function mapNotificationPreferenceFromDB(data: any): NotificationPreference {
  return {
    id: data.id,
    clientId: data.client_id,
    userId: data.user_id,
    event: data.event,
    channels: data.channels || [],
    enabled: data.enabled,
    quietHours: data.quiet_hours,
    minAmount: data.min_amount,
    schemes: data.schemes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

