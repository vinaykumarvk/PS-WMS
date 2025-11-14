/**
 * Automation Scheduler Service
 * Handles scheduled execution of automation rules
 * Module 11: Automation Features
 */

import * as automationService from './automation-service';
import type { AutoInvestRule, RebalancingRule, TriggerOrder } from '@shared/types/automation.types';

// ============================================================================
// Scheduler Configuration
// ============================================================================

/**
 * Check interval for automation execution (in milliseconds)
 * Default: Every hour (3600000 ms)
 */
const CHECK_INTERVAL = parseInt(process.env.AUTOMATION_CHECK_INTERVAL || '3600000', 10);

/**
 * Whether scheduler is running
 */
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// ============================================================================
// Auto-Invest Rule Execution
// ============================================================================

/**
 * Process auto-invest rules scheduled for today
 */
export async function processAutoInvestRules(): Promise<void> {
  try {
    console.log('[Automation Scheduler] Processing auto-invest rules...');
    
    // Get all active auto-invest rules
    // Note: This would need to be enhanced to fetch rules efficiently
    // For now, we'll process rules that need execution today
    
    const today = new Date().toISOString().slice(0, 10);
    
    // This is a placeholder - in production, you'd query the database
    // for rules where next_execution_date = today and status = 'Active' and is_enabled = true
    
    console.log(`[Automation Scheduler] Checking rules for ${today}`);
    
    // Example: Process rules for a specific client (would be done for all clients)
    // In production, iterate through all clients with active rules
    
  } catch (error: any) {
    console.error('[Automation Scheduler] Error processing auto-invest rules:', error);
  }
}

/**
 * Execute a specific auto-invest rule
 */
export async function executeAutoInvestRule(ruleId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    console.log(`[Automation Scheduler] Executing auto-invest rule: ${ruleId}`);
    
    const result = await automationService.executeAutoInvestRule(ruleId);
    
    if (result.success) {
      console.log(`[Automation Scheduler] Auto-invest rule ${ruleId} executed successfully. Order ID: ${result.orderId}`);
    } else {
      console.warn(`[Automation Scheduler] Auto-invest rule ${ruleId} execution failed: ${result.error}`);
    }
    
    return result;
  } catch (error: any) {
    console.error(`[Automation Scheduler] Error executing auto-invest rule ${ruleId}:`, error);
    return { success: false, error: error.message || 'Execution failed' };
  }
}

// ============================================================================
// Rebalancing Execution
// ============================================================================

/**
 * Check and execute rebalancing rules
 */
export async function processRebalancingRules(): Promise<void> {
  try {
    console.log('[Automation Scheduler] Processing rebalancing rules...');
    
    const today = new Date().toISOString().slice(0, 10);
    
    // Check rules that need rebalancing
    // In production, query database for:
    // - Rules where next_rebalancing_date = today
    // - Rules where trigger_on_drift = true and portfolio drift exceeds threshold
    // - Rules where trigger_on_schedule = true and schedule matches
    
    console.log(`[Automation Scheduler] Checking rebalancing rules for ${today}`);
    
    // For now, this is a no-op that will be implemented with database queries
    
  } catch (error: any) {
    console.error('[Automation Scheduler] Error processing rebalancing rules:', error);
  }
}

/**
 * Check if a rebalancing rule should execute
 */
export async function checkRebalancingRule(ruleId: string): Promise<boolean> {
  try {
    const needsRebalancing = await automationService.checkRebalancingNeeded(ruleId);
    return needsRebalancing;
  } catch (error: any) {
    console.error(`[Automation Scheduler] Error checking rebalancing rule ${ruleId}:`, error);
    return false;
  }
}

// ============================================================================
// Trigger Order Execution
// ============================================================================

/**
 * Check and execute trigger orders
 */
export async function processTriggerOrders(): Promise<void> {
  try {
    console.log('[Automation Scheduler] Processing trigger orders...');
    
    // Check all active trigger orders
    // In production, this would:
    // 1. Fetch all active trigger orders
    // 2. Check if trigger conditions are met
    // 3. Execute orders where conditions are met
    
    const triggeredOrders = await automationService.checkTriggerOrders();
    
    if (triggeredOrders && triggeredOrders.length > 0) {
      console.log(`[Automation Scheduler] Found ${triggeredOrders.length} triggered orders`);
    }
  } catch (error: any) {
    console.error('[Automation Scheduler] Error processing trigger orders:', error);
  }
}

// ============================================================================
// Main Scheduler Loop
// ============================================================================

/**
 * Main scheduler function that runs periodically
 */
async function schedulerLoop(): Promise<void> {
  try {
    console.log('[Automation Scheduler] Running scheduled checks...');
    
    // Process all automation types
    await Promise.all([
      processAutoInvestRules(),
      processRebalancingRules(),
      processTriggerOrders(),
    ]);
    
    console.log('[Automation Scheduler] Scheduled checks completed');
  } catch (error: any) {
    console.error('[Automation Scheduler] Error in scheduler loop:', error);
  }
}

/**
 * Start the automation scheduler
 */
export function startScheduler(): void {
  if (isRunning) {
    console.warn('[Automation Scheduler] Scheduler is already running');
    return;
  }
  
  console.log(`[Automation Scheduler] Starting scheduler (check interval: ${CHECK_INTERVAL}ms)`);
  
  isRunning = true;
  
  // Run immediately on start
  schedulerLoop().catch((error) => {
    console.error('[Automation Scheduler] Error in initial scheduler run:', error);
  });
  
  // Then run periodically
  intervalId = setInterval(() => {
    schedulerLoop().catch((error) => {
      console.error('[Automation Scheduler] Error in scheduled run:', error);
    });
  }, CHECK_INTERVAL);
}

/**
 * Stop the automation scheduler
 */
export function stopScheduler(): void {
  if (!isRunning) {
    console.warn('[Automation Scheduler] Scheduler is not running');
    return;
  }
  
  console.log('[Automation Scheduler] Stopping scheduler');
  
  isRunning = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return isRunning;
}

// ============================================================================
// Manual Execution Functions (for testing/admin)
// ============================================================================

/**
 * Manually trigger auto-invest rule execution
 */
export async function manualExecuteAutoInvest(ruleId: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await executeAutoInvestRule(ruleId);
    if (result && result.success) {
      return { success: true, message: 'Auto-invest rule executed successfully' };
    } else {
      return { success: false, message: result?.error || 'Failed to execute auto-invest rule' };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to execute auto-invest rule' };
  }
}

/**
 * Manually trigger rebalancing check
 */
export async function manualCheckRebalancing(ruleId: string): Promise<{ needsRebalancing: boolean; message: string }> {
  try {
    const needsRebalancing = await checkRebalancingRule(ruleId);
    return {
      needsRebalancing,
      message: needsRebalancing ? 'Rebalancing needed' : 'No rebalancing needed',
    };
  } catch (error: any) {
    return { needsRebalancing: false, message: error.message || 'Failed to check rebalancing' };
  }
}

/**
 * Manually trigger trigger order check
 */
export async function manualCheckTriggers(clientId?: number): Promise<{ triggered: number; message: string }> {
  try {
    const triggeredOrders = await automationService.checkTriggerOrders(clientId);
    return {
      triggered: triggeredOrders?.length || 0,
      message: `Found ${triggeredOrders?.length || 0} triggered orders`,
    };
  } catch (error: any) {
    return { triggered: 0, message: error.message || 'Failed to check trigger orders' };
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Cleanup on process exit
 */
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[Automation Scheduler] SIGTERM received, stopping scheduler...');
    stopScheduler();
  });
  
  process.on('SIGINT', () => {
    console.log('[Automation Scheduler] SIGINT received, stopping scheduler...');
    stopScheduler();
  });
}

