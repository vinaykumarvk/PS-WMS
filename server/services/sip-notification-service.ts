/**
 * SIP Notification Service
 * Handles email and SMS notifications for SIP events
 * Uses integration stubs - replace with actual providers when ready
 */

import { SIPPlan } from '../../shared/types/sip.types';
import { SIPExecutionLog } from './sip-scheduler-service';
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

export interface NotificationOptions {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

/**
 * Send SIP execution success notification
 */
export async function sendSIPExecutionSuccessNotification(
  plan: SIPPlan,
  executionLog: SIPExecutionLog,
  options: NotificationOptions = { email: true }
): Promise<void> {
  const subject = `SIP Execution Successful - ${plan.schemeName}`;
  const message = `
    Dear Investor,

    Your SIP installment has been successfully executed.

    Details:
    - Scheme: ${plan.schemeName}
    - Amount: ₹${plan.amount.toLocaleString()}
    - NAV: ₹${executionLog.nav?.toFixed(2) || 'N/A'}
    - Units Allotted: ${executionLog.units?.toFixed(4) || 'N/A'}
    - Order ID: ${executionLog.orderId}
    - Execution Date: ${executionLog.executionDate}

    Your investment is now active. Thank you for investing with us!

    Best regards,
    WealthRM Team
  `;

  if (options.email) {
    await sendEmail(plan.clientId, subject, message);
  }

  if (options.sms) {
    await sendSMS(plan.clientId, `SIP executed: ₹${plan.amount.toLocaleString()} in ${plan.schemeName}. Order: ${executionLog.orderId}`);
  }
}

/**
 * Send SIP execution failure notification
 */
export async function sendSIPExecutionFailureNotification(
  plan: SIPPlan,
  executionLog: SIPExecutionLog,
  options: NotificationOptions = { email: true }
): Promise<void> {
  const subject = `SIP Execution Failed - ${plan.schemeName}`;
  const message = `
    Dear Investor,

    We regret to inform you that your SIP installment could not be executed.

    Details:
    - Scheme: ${plan.schemeName}
    - Amount: ₹${plan.amount.toLocaleString()}
    - Failure Reason: ${executionLog.failureReason || 'Unknown'}
    - Retry Count: ${executionLog.retryCount}/3
    - Execution Date: ${executionLog.executionDate}

    ${executionLog.retryCount < 3 
      ? 'We will retry the execution automatically. Please ensure sufficient funds are available.'
      : 'Maximum retry attempts reached. Please contact support or update your payment method.'
    }

    Best regards,
    WealthRM Team
  `;

  if (options.email) {
    await sendEmail(plan.clientId, subject, message);
  }

  if (options.sms) {
    await sendSMS(plan.clientId, `SIP failed: ${plan.schemeName}. Reason: ${executionLog.failureReason || 'Unknown'}`);
  }
}

/**
 * Send SIP completion notification
 */
export async function sendSIPCompletionNotification(
  plan: SIPPlan,
  options: NotificationOptions = { email: true }
): Promise<void> {
  const subject = `SIP Plan Completed - ${plan.schemeName}`;
  const message = `
    Dear Investor,

    Congratulations! Your SIP plan has been completed successfully.

    Summary:
    - Scheme: ${plan.schemeName}
    - Total Installments: ${plan.installments}
    - Total Invested: ₹${plan.totalInvested?.toLocaleString() || '0'}
    - Current Value: ₹${plan.currentValue?.toLocaleString() || '0'}
    - Gain/Loss: ₹${plan.gainLoss?.toLocaleString() || '0'} (${plan.gainLossPercent?.toFixed(2) || '0'}%)

    Thank you for your continued investment. You can start a new SIP anytime!

    Best regards,
    WealthRM Team
  `;

  if (options.email) {
    await sendEmail(plan.clientId, subject, message);
  }
}

/**
 * Send SIP reminder notification (before execution)
 */
export async function sendSIPReminderNotification(
  plan: SIPPlan,
  daysBefore: number = 1,
  options: NotificationOptions = { email: true }
): Promise<void> {
  const subject = `SIP Reminder - ${plan.schemeName}`;
  const message = `
    Dear Investor,

    This is a reminder that your SIP installment is scheduled for execution.

    Details:
    - Scheme: ${plan.schemeName}
    - Amount: ₹${plan.amount.toLocaleString()}
    - Scheduled Date: ${plan.nextInstallmentDate}
    - Days Remaining: ${daysBefore}

    Please ensure sufficient funds are available in your registered bank account.

    Best regards,
    WealthRM Team
  `;

  if (options.email) {
    await sendEmail(plan.clientId, subject, message);
  }
}

/**
 * Send email using integration stub
 * Replace with actual email service integration when ready
 */
async function sendEmail(clientId: number, subject: string, message: string): Promise<void> {
  // TODO: Fetch client email from database
  // For now, using mock email
  const clientEmail = `client${clientId}@example.com`; // Mock email
  
  const provider = getEmailProvider();
  await provider.sendEmail({
    to: clientEmail,
    subject,
    html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br>')}</div>`,
    text: message,
  });
}

/**
 * Send SMS using integration stub
 * Replace with actual SMS service integration when ready
 */
async function sendSMS(clientId: number, message: string): Promise<void> {
  // TODO: Fetch client phone number from database
  // For now, using mock phone number
  const clientPhone = `+919876543210`; // Mock phone number
  
  const provider = getSMSProvider();
  await provider.sendSMS({
    to: clientPhone,
    message,
  });
}

