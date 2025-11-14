/**
 * SIP Execution Scheduler Service
 * Handles scheduled execution of SIP plans with retry logic and NAV integration
 */

import { db } from '../db';
import { sipPlans } from '../../shared/schema';
import { eq, and, lte } from 'drizzle-orm';
import {
  getSIPById,
  getSIPsByClient,
  type SIPPlan,
  type SIPStatus,
} from './sip-service';
import { getNAV } from './nav-service';
import {
  sendSIPExecutionSuccessNotification,
  sendSIPExecutionFailureNotification,
  sendSIPCompletionNotification,
} from './sip-notification-service';

export interface SIPExecutionLog {
  id: string;
  planId: string;
  executionDate: string;
  executionTime: string;
  status: 'Success' | 'Failed' | 'Retrying';
  retryCount: number;
  failureReason?: string;
  orderId?: string;
  nav?: number;
  units?: number;
  amount: number;
  createdAt: string;
}

// In-memory execution logs (replace with database table in production)
const executionLogs: Map<string, SIPExecutionLog> = new Map();

// NAV service is imported from nav-service.ts

// Initialize order service from integration config
let orderService: any = null;
function getOrderService() {
  if (!orderService) {
    const { getIntegrationConfig, createIntegrationInstances } = require('../integrations/config');
    const config = getIntegrationConfig();
    const instances = createIntegrationInstances(config);
    orderService = instances.orderService;
  }
  return orderService;
}

/**
 * Create order for SIP execution
 * Uses integration stub - replace with actual Order Service when ready
 */
async function createSIPOrder(plan: SIPPlan, nav: number): Promise<{ success: boolean; orderId?: string; units?: number; failureReason?: string }> {
  try {
    // Calculate units
    const units = plan.amount / nav;

    // Use Order Service from integration stubs
    const service = getOrderService();
    const response = await service.createOrder({
      clientId: plan.clientId,
      schemeId: plan.schemeId,
      amount: plan.amount,
      transactionType: 'Purchase',
      orderType: 'Additional Purchase',
      paymentMethod: 'Auto Debit',
      transactionMode: 'Email',
    });

    if (response.success && response.orderId) {
      return { success: true, orderId: response.orderId, units };
    } else {
      return { success: false, failureReason: response.error || 'Order creation failed' };
    }
  } catch (error: any) {
    return { success: false, failureReason: error.message || 'Order creation failed' };
  }
}

/**
 * Update SIP plan after successful execution
 */
async function updateSIPAfterExecution(planId: string, units: number, nav: number): Promise<void> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) return;

  const completedInstallments = plan.completedInstallments + 1;
  const totalInvested = (plan.totalInvested || 0) + plan.amount;
  const currentValue = totalInvested * (nav / 100); // Simplified calculation
  const gainLoss = currentValue - totalInvested;
  const gainLossPercent = (gainLoss / totalInvested) * 100;

  // Calculate next installment date
  const nextDate = calculateNextInstallmentDate(
    plan.startDate,
    plan.frequency,
    completedInstallments
  );

  const isCompleted = completedInstallments >= plan.installments;

  await db.update(sipPlans)
    .set({
      completedInstallments,
      totalInvested,
      currentValue: Math.round(currentValue),
      gainLoss: Math.round(gainLoss),
      gainLossPercent,
      lastExecutionDate: new Date(),
      lastExecutionStatus: 'Success',
      failureCount: 0,
      status: isCompleted ? 'Completed' : 'Active',
      nextInstallmentDate: isCompleted ? null : nextDate,
    })
    .where(eq(sipPlans.id, planId));
}

/**
 * Calculate next installment date
 */
function calculateNextInstallmentDate(
  startDate: string,
  frequency: string,
  completedInstallments: number
): string {
  const start = new Date(startDate);
  const next = new Date(start);

  switch (frequency) {
    case 'Daily':
      next.setDate(start.getDate() + completedInstallments + 1);
      break;
    case 'Weekly':
      next.setDate(start.getDate() + (completedInstallments + 1) * 7);
      break;
    case 'Monthly':
      next.setMonth(start.getMonth() + completedInstallments + 1);
      break;
    case 'Quarterly':
      next.setMonth(start.getMonth() + (completedInstallments + 1) * 3);
      break;
  }

  return next.toISOString().split('T')[0];
}

/**
 * Mark SIP execution as failed
 */
async function markSIPExecutionFailed(planId: string, failureReason: string, retryCount: number): Promise<void> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) return;

  const maxRetries = 3;
  const shouldMarkFailed = retryCount >= maxRetries;

  await db.update(sipPlans)
    .set({
      lastExecutionDate: new Date(),
      lastExecutionStatus: 'Failed',
      failureCount: retryCount,
      status: shouldMarkFailed ? 'Failed' : plan.status,
    })
    .where(eq(sipPlans.id, planId));
}

/**
 * Process SIP execution with retry logic
 */
export async function processSIPExecution(plan: SIPPlan): Promise<SIPExecutionLog> {
  const executionDate = new Date().toISOString().split('T')[0];
  const executionTime = new Date().toISOString();

  try {
    // Get NAV for the scheme
    const nav = await getNAV(plan.schemeId);

    // Create order
    const result = await createSIPOrder(plan, nav);

    if (result.success && result.orderId && result.units) {
      // Execution successful
      const wasCompleted = plan.completedInstallments + 1 >= plan.installments;
      await updateSIPAfterExecution(plan.id, result.units, nav);

      const log: SIPExecutionLog = {
        id: `SIP-LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        planId: plan.id,
        executionDate,
        executionTime,
        status: 'Success',
        retryCount: plan.failureCount || 0,
        orderId: result.orderId,
        nav,
        units: result.units,
        amount: plan.amount,
        createdAt: new Date().toISOString(),
      };

      executionLogs.set(log.id, log);

      // Send notifications
      const updatedPlan = await getSIPById(plan.id);
      if (updatedPlan) {
        await sendSIPExecutionSuccessNotification(updatedPlan, log);
        if (wasCompleted) {
          await sendSIPCompletionNotification(updatedPlan);
        }
      }

      return log;
    } else {
      // Execution failed
      const retryCount = (plan.failureCount || 0) + 1;
      await markSIPExecutionFailed(plan.id, result.failureReason || 'Execution failed', retryCount);

      const log: SIPExecutionLog = {
        id: `SIP-LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        planId: plan.id,
        executionDate,
        executionTime,
        status: retryCount >= 3 ? 'Failed' : 'Retrying',
        retryCount,
        failureReason: result.failureReason,
        nav,
        amount: plan.amount,
        createdAt: new Date().toISOString(),
      };

      executionLogs.set(log.id, log);

      // Send failure notification
      await sendSIPExecutionFailureNotification(plan, log);

      return log;
    }
  } catch (error: any) {
    const retryCount = (plan.failureCount || 0) + 1;
    await markSIPExecutionFailed(plan.id, error.message || 'Execution error', retryCount);

    const log: SIPExecutionLog = {
      id: `SIP-LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      planId: plan.id,
      executionDate,
      executionTime,
      status: retryCount >= 3 ? 'Failed' : 'Retrying',
      retryCount,
      failureReason: error.message || 'Execution error',
      amount: plan.amount,
      createdAt: new Date().toISOString(),
    };

    executionLogs.set(log.id, log);

    // Send failure notification
    const planData = await getSIPById(plan.id);
    if (planData) {
      await sendSIPExecutionFailureNotification(planData, log);
    }

    return log;
  }
}

/**
 * Get SIP plans scheduled for execution on a given date
 */
export async function getSIPsScheduledForDate(date: string): Promise<SIPPlan[]> {
  const plans = await db.select()
    .from(sipPlans)
    .where(
      and(
        eq(sipPlans.status, 'Active'),
        eq(sipPlans.nextInstallmentDate, date)
      )
    );

  return plans.map((plan: any) => ({
    id: plan.id,
    clientId: plan.clientId,
    schemeId: plan.schemeId,
    schemeName: plan.schemeName,
    amount: plan.amount,
    frequency: plan.frequency,
    startDate: plan.startDate,
    endDate: plan.endDate || undefined,
    installments: plan.installments,
    completedInstallments: plan.completedInstallments,
    status: plan.status,
    nextInstallmentDate: plan.nextInstallmentDate || undefined,
    totalInvested: plan.totalInvested || undefined,
    currentValue: plan.currentValue || undefined,
    gainLoss: plan.gainLoss || undefined,
    gainLossPercent: plan.gainLossPercent || undefined,
    createdAt: plan.createdAt?.toISOString() || new Date().toISOString(),
    pausedAt: plan.pausedAt?.toISOString() || undefined,
    cancelledAt: plan.cancelledAt?.toISOString() || undefined,
    cancellationReason: plan.cancellationReason || undefined,
    lastExecutionDate: plan.lastExecutionDate?.toISOString() || undefined,
    lastExecutionStatus: plan.lastExecutionStatus || undefined,
    failureCount: plan.failureCount || undefined,
  }));
}

/**
 * Process all SIP plans scheduled for today
 */
export async function processScheduledSIPs(date?: string): Promise<SIPExecutionLog[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const plans = await getSIPsScheduledForDate(targetDate);

  const logs: SIPExecutionLog[] = [];

  for (const plan of plans) {
    // Only process active plans
    if (plan.status === 'Active') {
      const log = await processSIPExecution(plan);
      logs.push(log);
    }
  }

  return logs;
}

/**
 * Retry failed SIP executions
 */
export async function retryFailedSIPExecutions(): Promise<SIPExecutionLog[]> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get plans that failed but haven't exceeded max retries
  const plans = await db.select()
    .from(sipPlans)
    .where(
      and(
        eq(sipPlans.status, 'Active'),
        eq(sipPlans.lastExecutionStatus, 'Failed'),
        lte(sipPlans.failureCount, 2) // Less than max retries
      )
    );

  const logs: SIPExecutionLog[] = [];

  for (const plan of plans) {
    const planData = await getSIPById(plan.id);
    if (planData && planData.nextInstallmentDate === today) {
      const log = await processSIPExecution(planData);
      logs.push(log);
    }
  }

  return logs;
}

/**
 * Get execution logs for a SIP plan
 */
export function getSIPExecutionLogs(planId: string): SIPExecutionLog[] {
  return Array.from(executionLogs.values()).filter(log => log.planId === planId);
}

/**
 * Get all execution logs
 */
export function getAllSIPExecutionLogs(startDate?: string, endDate?: string): SIPExecutionLog[] {
  let logs = Array.from(executionLogs.values());

  if (startDate) {
    logs = logs.filter(log => log.executionDate >= startDate);
  }

  if (endDate) {
    logs = logs.filter(log => log.executionDate <= endDate);
  }

  return logs.sort((a, b) => b.executionDate.localeCompare(a.executionDate));
}

/**
 * Clear execution logs (for testing)
 */
export function clearExecutionLogs(): void {
  executionLogs.clear();
}

