/**
 * SIP Service
 * Comprehensive service for SIP operations including calculator, calendar, and performance tracking
 */

import {
  SIPPlan,
  SIPBuilderInput,
  SIPCalculatorInput,
  SIPCalculatorResult,
  SIPCalendarEvent,
  SIPPerformance,
  SIPFrequency,
  SIPStatus,
} from '../../shared/types/sip.types';
import { db } from '../db';
import { sipPlans, products } from '../../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Generate unique SIP plan ID
 */
function generateSIPId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SIP-${dateStr}-${randomStr}`;
}

/**
 * Calculate next installment date based on frequency
 */
function calculateNextInstallmentDate(
  startDate: string,
  frequency: SIPFrequency,
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
 * Create SIP plan
 */
export async function createSIP(
  clientId: number,
  data: SIPBuilderInput
): Promise<SIPPlan> {
  // Validate start date is in future
  const startDate = new Date(data.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate <= today) {
    throw new Error('Start date must be a future date');
  }

  // Validate amount
  if (data.amount < 1000) {
    throw new Error('SIP amount must be at least ₹1,000');
  }

  // Fetch scheme name from products table
  const [product] = await db.select().from(products).where(eq(products.id, data.schemeId)).limit(1);
  if (!product) {
    throw new Error('Scheme not found');
  }

  const planId = generateSIPId();
  const planData = {
    id: planId,
    clientId,
    schemeId: data.schemeId,
    schemeName: product.name, // Use product name as scheme name
    amount: data.amount,
    frequency: data.frequency,
    startDate: data.startDate,
    endDate: data.endDate || null,
    installments: data.installments || 12,
    completedInstallments: 0,
    status: 'Active' as SIPStatus,
    nextInstallmentDate: data.startDate,
    dayOfMonth: data.dayOfMonth || null,
    dayOfWeek: data.dayOfWeek || null,
  };

  await db.insert(sipPlans).values(planData);

  return {
    id: planId,
    clientId,
    schemeId: data.schemeId,
    schemeName: product.name,
    amount: data.amount,
    frequency: data.frequency,
    startDate: data.startDate,
    endDate: data.endDate,
    installments: data.installments || 12,
    completedInstallments: 0,
    status: 'Active',
    nextInstallmentDate: data.startDate,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get SIP plan by ID
 */
export async function getSIPById(planId: string): Promise<SIPPlan | null> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) return null;
  
  return mapDBPlanToSIPPlan(plan);
}

/**
 * Get SIP plans for a client
 */
export async function getSIPsByClient(
  clientId: number,
  status?: SIPStatus
): Promise<SIPPlan[]> {
  let query = db.select().from(sipPlans);
  
  if (status) {
    query = query.where(and(eq(sipPlans.clientId, clientId), eq(sipPlans.status, status))) as any;
  } else {
    query = query.where(eq(sipPlans.clientId, clientId)) as any;
  }
  
  const plans = await query;
  return plans.map(mapDBPlanToSIPPlan);
}

/**
 * Helper function to map database plan to SIPPlan type
 */
function mapDBPlanToSIPPlan(plan: any): SIPPlan {
  return {
    id: plan.id,
    clientId: plan.clientId,
    schemeId: plan.schemeId,
    schemeName: plan.schemeName,
    amount: plan.amount,
    frequency: plan.frequency as SIPFrequency,
    startDate: plan.startDate,
    endDate: plan.endDate || undefined,
    installments: plan.installments,
    completedInstallments: plan.completedInstallments,
    status: plan.status as SIPStatus,
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
  };
}

/**
 * Pause SIP plan
 */
export async function pauseSIP(
  planId: string,
  pauseUntil?: string
): Promise<SIPPlan> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) {
    throw new Error('SIP plan not found');
  }

  if (plan.status !== 'Active') {
    throw new Error('Can only pause active SIP plans');
  }

  await db.update(sipPlans)
    .set({
      status: 'Paused',
      pausedAt: new Date(),
    })
    .where(eq(sipPlans.id, planId));

  const [updatedPlan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  return mapDBPlanToSIPPlan(updatedPlan!);
}

/**
 * Resume SIP plan
 */
export async function resumeSIP(planId: string): Promise<SIPPlan> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) {
    throw new Error('SIP plan not found');
  }

  if (plan.status !== 'Paused') {
    throw new Error('Can only resume paused SIP plans');
  }

  await db.update(sipPlans)
    .set({
      status: 'Active',
      pausedAt: null,
    })
    .where(eq(sipPlans.id, planId));

  const [updatedPlan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  return mapDBPlanToSIPPlan(updatedPlan!);
}

/**
 * Modify SIP plan
 */
export async function modifySIP(
  planId: string,
  updates: { newAmount?: number; newFrequency?: SIPFrequency }
): Promise<SIPPlan> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) {
    throw new Error('SIP plan not found');
  }

  if (plan.status !== 'Active') {
    throw new Error('Can only modify active SIP plans');
  }

  // Check if plan is scheduled for execution today
  const today = new Date().toISOString().split('T')[0];
  if (plan.nextInstallmentDate && plan.nextInstallmentDate.toISOString().split('T')[0] === today) {
    throw new Error('Cannot modify plan scheduled for execution today');
  }

  const updateData: any = {};
  if (updates.newAmount !== undefined) {
    updateData.amount = updates.newAmount;
  }
  if (updates.newFrequency !== undefined) {
    updateData.frequency = updates.newFrequency;
  }

  await db.update(sipPlans)
    .set(updateData)
    .where(eq(sipPlans.id, planId));

  const [updatedPlan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  return mapDBPlanToSIPPlan(updatedPlan!);
}

/**
 * Cancel SIP plan
 */
export async function cancelSIP(
  planId: string,
  reason: string
): Promise<SIPPlan> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) {
    throw new Error('SIP plan not found');
  }

  if (plan.status === 'Completed' || plan.status === 'Cancelled') {
    throw new Error('Cannot cancel completed or already cancelled plan');
  }

  await db.update(sipPlans)
    .set({
      status: 'Cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
    })
    .where(eq(sipPlans.id, planId));

  const [updatedPlan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  return mapDBPlanToSIPPlan(updatedPlan!);
}

/**
 * Calculate SIP returns
 */
export async function calculateSIP(
  input: SIPCalculatorInput
): Promise<SIPCalculatorResult> {
  const monthlyRate = input.expectedReturn / 100 / 12;
  const installmentsPerMonth =
    input.frequency === 'Monthly'
      ? 1
      : input.frequency === 'Quarterly'
      ? 1 / 3
      : input.frequency === 'Weekly'
      ? 4
      : 30;

  const monthlyBreakdown: any[] = [];
  let cumulativeInvested = 0;
  let cumulativeValue = 0;

  for (let month = 1; month <= input.duration; month++) {
    const invested = input.amount * installmentsPerMonth;
    cumulativeInvested += invested;

    // Calculate value with compound interest
    cumulativeValue = (cumulativeValue + invested) * (1 + monthlyRate);

    const returns = cumulativeValue - cumulativeInvested;
    const returnPercentage = (returns / cumulativeInvested) * 100;

    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date();
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(startDate.getMonth() + month - 1);

    monthlyBreakdown.push({
      month,
      date: installmentDate.toISOString().split('T')[0],
      invested,
      cumulativeInvested,
      value: cumulativeValue,
      returns,
      returnPercentage,
    });
  }

  return {
    totalInvested: cumulativeInvested,
    expectedValue: cumulativeValue,
    estimatedReturns: cumulativeValue - cumulativeInvested,
    returnPercentage:
      ((cumulativeValue - cumulativeInvested) / cumulativeInvested) * 100,
    monthlyBreakdown,
    summary: {
      totalInstallments: Math.ceil(input.duration * installmentsPerMonth),
      averageNAV: 100, // Placeholder
      finalNAV: 100 * Math.pow(1 + monthlyRate, input.duration), // Placeholder
    },
  };
}

/**
 * Get SIP calendar events
 */
export async function getSIPCalendar(
  clientId: number,
  startDate: string,
  endDate: string
): Promise<SIPCalendarEvent[]> {
  const plans = await getSIPsByClient(clientId);
  const events: SIPCalendarEvent[] = [];

  plans.forEach((plan) => {
    if (plan.status !== 'Active' && plan.status !== 'Paused') return;

    const start = new Date(plan.startDate);
    const end = endDate ? new Date(endDate) : (plan.endDate ? new Date(plan.endDate) : new Date('2099-12-31'));
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    let currentDate = new Date(start);
    let installmentCount = 0;

    while (currentDate <= end && installmentCount < plan.installments) {
      if (currentDate >= rangeStart && currentDate <= rangeEnd) {
        events.push({
          date: currentDate.toISOString().split('T')[0],
          planId: plan.id,
          schemeName: plan.schemeName || `Scheme ${plan.schemeId}`,
          amount: plan.amount,
          status:
            installmentCount < plan.completedInstallments
              ? 'Completed'
              : currentDate < new Date()
              ? 'Failed'
              : 'Scheduled',
        });
      }

      // Calculate next date based on frequency
      switch (plan.frequency) {
        case 'Daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'Weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'Monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'Quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }

      installmentCount++;
    }
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get SIP performance
 */
export async function getSIPPerformance(planId: string): Promise<SIPPerformance> {
  const [plan] = await db.select().from(sipPlans).where(eq(sipPlans.id, planId)).limit(1);
  if (!plan) {
    throw new Error('SIP plan not found');
  }

  // Use stored performance data if available, otherwise calculate
  const totalInvested = plan.totalInvested || plan.amount * plan.completedInstallments;
  const currentValue = plan.currentValue || totalInvested * 1.15; // Mock 15% return if not set
  const gainLoss = plan.gainLoss !== null ? plan.gainLoss : (currentValue - totalInvested);
  const gainLossPercent = plan.gainLossPercent !== null ? plan.gainLossPercent : ((gainLoss / totalInvested) * 100);

  // Mock lump sum comparison (replace with actual calculation in production)
  const lumpSumValue = totalInvested * 1.12; // Mock 12% return for lump sum
  const sipValue = currentValue;
  const difference = sipValue - lumpSumValue;
  const differencePercent = ((difference / lumpSumValue) * 100);

  return {
    planId,
    totalInvested,
    currentValue,
    gainLoss,
    gainLossPercent,
    xirr: 14.5, // Mock XIRR (replace with actual calculation)
    vsLumpSum: {
      lumpSumValue,
      sipValue,
      difference,
      differencePercent,
    },
  };
}

