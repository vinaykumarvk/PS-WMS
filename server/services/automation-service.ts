/**
 * Automation Service
 * Handles auto-invest rules, rebalancing automation, and trigger-based orders
 * Module 11: Automation Features
 */

import { supabaseServer } from '../lib/supabase';
import type {
  AutoInvestRule,
  CreateAutoInvestRuleInput,
  UpdateAutoInvestRuleInput,
  RebalancingRule,
  CreateRebalancingRuleInput,
  RebalancingExecution,
  RebalancingAction,
  TriggerOrder,
  CreateTriggerOrderInput,
  AutomationExecutionLog,
} from '@shared/types/automation.types';
import type { Goal } from '@shared/types/order-management.types';
import * as goalService from './goal-service';

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}-${dateStr}-${random}`;
}

function calculateNextExecutionDate(
  frequency: string,
  startDate: string,
  dayOfMonth?: number,
  dayOfWeek?: number
): string {
  const start = new Date(startDate);
  const now = new Date();
  
  if (frequency === 'Daily') {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  }
  
  if (frequency === 'Weekly') {
    const next = new Date(now);
    const daysUntilNext = (dayOfWeek || 0) - next.getDay();
    if (daysUntilNext <= 0) {
      next.setDate(next.getDate() + 7 + daysUntilNext);
    } else {
      next.setDate(next.getDate() + daysUntilNext);
    }
    return next.toISOString().slice(0, 10);
  }
  
  if (frequency === 'Monthly') {
    const next = new Date(now);
    const targetDay = dayOfMonth || start.getDate();
    next.setDate(targetDay);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString().slice(0, 10);
  }
  
  if (frequency === 'Quarterly') {
    const next = new Date(now);
    const targetDay = dayOfMonth || start.getDate();
    next.setDate(targetDay);
    next.setMonth(next.getMonth() + 3);
    if (next <= now) {
      next.setMonth(next.getMonth() + 3);
    }
    return next.toISOString().slice(0, 10);
  }
  
  return startDate;
}

// ============================================================================
// Auto-Invest Rules
// ============================================================================

/**
 * Create a new auto-invest rule
 */
export async function createAutoInvestRule(
  input: CreateAutoInvestRuleInput,
  userId: number
): Promise<AutoInvestRule> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const ruleId = generateId('AUTO');
  const nextExecutionDate = calculateNextExecutionDate(
    input.frequency,
    input.startDate,
    input.triggerConfig.dayOfMonth,
    input.triggerConfig.dayOfWeek
  );

  const ruleData = {
    id: ruleId,
    client_id: input.clientId,
    name: input.name,
    description: input.description || null,
    scheme_id: input.schemeId,
    scheme_name: '', // Will be populated from product lookup
    amount: input.amount,
    frequency: input.frequency,
    trigger_type: input.triggerType,
    trigger_config: input.triggerConfig,
    goal_id: input.goalId || null,
    goal_name: null, // Will be populated if goalId exists
    start_date: input.startDate,
    end_date: input.endDate || null,
    next_execution_date: nextExecutionDate,
    status: 'Active',
    is_enabled: true,
    max_total_amount: input.maxTotalAmount || null,
    max_per_execution: input.maxPerExecution || null,
    min_balance_required: input.minBalanceRequired || null,
    created_by: userId,
    execution_count: 0,
  };

  // Get scheme name
  try {
    const { data: products } = await supabaseServer
      .from('products')
      .select('scheme_name')
      .eq('id', input.schemeId)
      .single();
    
    if (products) {
      ruleData.scheme_name = products.scheme_name;
    }
  } catch (error) {
    console.warn('Could not fetch scheme name:', error);
  }

  // Get goal name if goalId provided
  if (input.goalId) {
    try {
      const goal = await goalService.getGoalById(input.goalId);
      if (goal) {
        ruleData.goal_name = goal.name;
      }
    } catch (error) {
      console.warn('Could not fetch goal name:', error);
    }
  }

  const { data: rule, error } = await supabaseServer
    .from('auto_invest_rules')
    .insert(ruleData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create auto-invest rule: ${error.message}`);
  }

  return mapAutoInvestRuleFromDB(rule);
}

/**
 * Get all auto-invest rules for a client
 */
export async function getAutoInvestRules(clientId: number): Promise<AutoInvestRule[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: rules, error } = await supabaseServer
    .from('auto_invest_rules')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch auto-invest rules: ${error.message}`);
  }

  return (rules || []).map(mapAutoInvestRuleFromDB);
}

/**
 * Get a single auto-invest rule by ID
 */
export async function getAutoInvestRuleById(ruleId: string): Promise<AutoInvestRule | null> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: rule, error } = await supabaseServer
    .from('auto_invest_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch auto-invest rule: ${error.message}`);
  }

  return mapAutoInvestRuleFromDB(rule);
}

/**
 * Update an auto-invest rule
 */
export async function updateAutoInvestRule(
  ruleId: string,
  updates: UpdateAutoInvestRuleInput
): Promise<AutoInvestRule> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
  if (updates.triggerType !== undefined) updateData.trigger_type = updates.triggerType;
  if (updates.triggerConfig !== undefined) updateData.trigger_config = updates.triggerConfig;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.maxTotalAmount !== undefined) updateData.max_total_amount = updates.maxTotalAmount;
  if (updates.maxPerExecution !== undefined) updateData.max_per_execution = updates.maxPerExecution;

  // Recalculate next execution date if frequency changed
  if (updates.frequency || updates.triggerConfig) {
    const currentRule = await getAutoInvestRuleById(ruleId);
    if (currentRule) {
      const config = updates.triggerConfig || currentRule.triggerConfig;
      const frequency = updates.frequency || currentRule.frequency;
      updateData.next_execution_date = calculateNextExecutionDate(
        frequency,
        currentRule.startDate,
        config.dayOfMonth,
        config.dayOfWeek
      );
    }
  }

  const { data: rule, error } = await supabaseServer
    .from('auto_invest_rules')
    .update(updateData)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update auto-invest rule: ${error.message}`);
  }

  return mapAutoInvestRuleFromDB(rule);
}

/**
 * Delete an auto-invest rule
 */
export async function deleteAutoInvestRule(ruleId: string): Promise<void> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { error } = await supabaseServer
    .from('auto_invest_rules')
    .delete()
    .eq('id', ruleId);

  if (error) {
    throw new Error(`Failed to delete auto-invest rule: ${error.message}`);
  }
}

/**
 * Execute an auto-invest rule (called by scheduler)
 */
export async function executeAutoInvestRule(ruleId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const rule = await getAutoInvestRuleById(ruleId);
  if (!rule || !rule.isEnabled || rule.status !== 'Active') {
    return { success: false, error: 'Rule not active or not found' };
  }

  // Check if rule should execute based on trigger
  const shouldExecute = await checkTriggerConditions(rule);
  if (!shouldExecute) {
    return { success: false, error: 'Trigger conditions not met' };
  }

  // Check limits
  if (rule.maxTotalAmount && rule.executionCount * rule.amount >= rule.maxTotalAmount) {
    await updateAutoInvestRule(ruleId, { status: 'Completed' });
    return { success: false, error: 'Maximum total amount reached' };
  }

  if (rule.endDate && new Date() > new Date(rule.endDate)) {
    await updateAutoInvestRule(ruleId, { status: 'Completed' });
    return { success: false, error: 'Rule expired' };
  }

  try {
    // Create order (this would integrate with order service)
    // For now, generate a mock order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Update rule execution details
    const nextExecutionDate = calculateNextExecutionDate(
      rule.frequency,
      rule.startDate,
      rule.triggerConfig.dayOfMonth,
      rule.triggerConfig.dayOfWeek
    );

    await supabaseServer
      .from('auto_invest_rules')
      .update({
        execution_count: rule.executionCount + 1,
        last_execution_date: new Date().toISOString(),
        last_execution_status: 'Success',
        last_execution_error: null,
        next_execution_date: nextExecutionDate,
      })
      .eq('id', ruleId);

    // Log execution
    await logAutomationExecution({
      automationType: 'AutoInvest',
      automationId: ruleId,
      clientId: rule.clientId,
      status: 'Success',
      orderId,
    });

    return { success: true, orderId };
  } catch (error: any) {
    await supabaseServer
      .from('auto_invest_rules')
      .update({
        last_execution_status: 'Failed',
        last_execution_error: error.message,
      })
      .eq('id', ruleId);

    await logAutomationExecution({
      automationType: 'AutoInvest',
      automationId: ruleId,
      clientId: rule.clientId,
      status: 'Failed',
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Check if trigger conditions are met
 */
async function checkTriggerConditions(rule: AutoInvestRule): Promise<boolean> {
  if (rule.triggerType === 'Date') {
    const today = new Date().toISOString().slice(0, 10);
    return rule.nextExecutionDate === today;
  }

  if (rule.triggerType === 'Goal Progress') {
    if (!rule.goalId) return false;
    const goal = await goalService.getGoalById(rule.goalId);
    if (!goal) return false;

    const threshold = rule.triggerConfig.goalProgressThreshold || 0;
    const direction = rule.triggerConfig.goalProgressDirection || 'above';
    
    if (direction === 'above') {
      return goal.progress >= threshold;
    } else {
      return goal.progress <= threshold;
    }
  }

  // For other trigger types, would need portfolio/market data
  // For now, default to true for Date-based triggers
  return rule.triggerType === 'Date';
}

// ============================================================================
// Rebalancing Automation
// ============================================================================

/**
 * Create a rebalancing rule
 */
export async function createRebalancingRule(
  input: CreateRebalancingRuleInput,
  userId: number
): Promise<RebalancingRule> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const ruleId = generateId('REBAL');
  const nextRebalancingDate = input.frequency
    ? calculateNextExecutionDate(
        input.frequency,
        new Date().toISOString().slice(0, 10),
        input.dayOfMonth,
        input.dayOfWeek
      )
    : null;

  const ruleData = {
    id: ruleId,
    client_id: input.clientId,
    name: input.name,
    description: input.description || null,
    strategy: input.strategy,
    target_allocation: input.targetAllocation,
    threshold_percent: input.thresholdPercent,
    rebalance_amount: input.rebalanceAmount || null,
    frequency: input.frequency || null,
    day_of_month: input.dayOfMonth || null,
    day_of_week: input.dayOfWeek || null,
    trigger_on_drift: input.triggerOnDrift,
    trigger_on_schedule: input.triggerOnSchedule,
    min_drift_percent: input.minDriftPercent || null,
    execute_automatically: input.executeAutomatically,
    require_confirmation: input.requireConfirmation,
    status: 'Active',
    is_enabled: true,
    last_rebalanced_date: null,
    next_rebalancing_date: nextRebalancingDate,
    execution_count: 0,
  };

  const { data: rule, error } = await supabaseServer
    .from('rebalancing_rules')
    .insert(ruleData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create rebalancing rule: ${error.error || error.message}`);
  }

  return mapRebalancingRuleFromDB(rule);
}

/**
 * Get all rebalancing rules for a client
 */
export async function getRebalancingRules(clientId: number): Promise<RebalancingRule[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: rules, error } = await supabaseServer
    .from('rebalancing_rules')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch rebalancing rules: ${error.message}`);
  }

  return (rules || []).map(mapRebalancingRuleFromDB);
}

/**
 * Get a single rebalancing rule by ID
 */
export async function getRebalancingRuleById(ruleId: string): Promise<RebalancingRule | null> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: rule, error } = await supabaseServer
    .from('rebalancing_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch rebalancing rule: ${error.message}`);
  }

  return mapRebalancingRuleFromDB(rule);
}

/**
 * Check if portfolio needs rebalancing
 */
export async function checkRebalancingNeeded(ruleId: string): Promise<boolean> {
  const rule = await getRebalancingRuleById(ruleId);
  if (!rule || !rule.isEnabled || rule.status !== 'Active') {
    return false;
  }

  // This would fetch actual portfolio data
  // For now, return false (would need portfolio service integration)
  return false;
}

/**
 * Generate rebalancing actions
 */
export async function generateRebalancingActions(ruleId: string): Promise<RebalancingAction[]> {
  const rule = await getRebalancingRuleById(ruleId);
  if (!rule) {
    throw new Error('Rebalancing rule not found');
  }

  // This would analyze portfolio and generate actions
  // For now, return empty array (would need portfolio service integration)
  return [];
}

/**
 * Execute rebalancing
 */
export async function executeRebalancing(
  ruleId: string,
  userId: number
): Promise<RebalancingExecution> {
  const rule = await getRebalancingRuleById(ruleId);
  if (!rule) {
    throw new Error('Rebalancing rule not found');
  }

  const actions = await generateRebalancingActions(ruleId);
  
  const executionId = generateId('REBAL-EXEC');
  const execution: RebalancingExecution = {
    id: executionId,
    ruleId,
    clientId: rule.clientId,
    executionDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
    currentAllocation: {}, // Would fetch from portfolio
    targetAllocation: rule.targetAllocation,
    driftPercent: 0, // Would calculate from portfolio
    actions,
  };

  // Save execution
  if (supabaseServer) {
    await supabaseServer
      .from('rebalancing_executions')
      .insert({
        id: executionId,
        rule_id: ruleId,
        client_id: rule.clientId,
        execution_date: execution.executionDate,
        status: 'Pending',
        current_allocation: execution.currentAllocation,
        target_allocation: execution.targetAllocation,
        drift_percent: execution.driftPercent,
        actions: execution.actions,
      });
  }

  // Execute actions if automatic
  if (rule.executeAutomatically && !rule.requireConfirmation) {
    // Execute orders (would integrate with order service)
    execution.status = 'Executed';
    execution.executedAt = new Date().toISOString();
    execution.executedBy = userId;
  }

  return execution;
}

// ============================================================================
// Trigger-Based Orders
// ============================================================================

/**
 * Create a trigger order
 */
export async function createTriggerOrder(
  input: CreateTriggerOrderInput,
  userId: number
): Promise<TriggerOrder> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const orderId = generateId('TRIGGER');

  // Get scheme names
  let schemeName = '';
  let targetSchemeName = '';
  
  try {
    const { data: product } = await supabaseServer
      .from('products')
      .select('scheme_name')
      .eq('id', input.schemeId)
      .single();
    if (product) schemeName = product.scheme_name;
  } catch (error) {
    console.warn('Could not fetch scheme name:', error);
  }

  if (input.targetSchemeId) {
    try {
      const { data: targetProduct } = await supabaseServer
        .from('products')
        .select('scheme_name')
        .eq('id', input.targetSchemeId)
        .single();
      if (targetProduct) targetSchemeName = targetProduct.scheme_name;
    } catch (error) {
      console.warn('Could not fetch target scheme name:', error);
    }
  }

  // Get goal name if provided
  let goalName = null;
  if (input.goalId) {
    try {
      const goal = await goalService.getGoalById(input.goalId);
      if (goal) goalName = goal.name;
    } catch (error) {
      console.warn('Could not fetch goal name:', error);
    }
  }

  const orderData = {
    id: orderId,
    client_id: input.clientId,
    name: input.name,
    description: input.description || null,
    trigger_type: input.triggerType,
    trigger_condition: input.triggerCondition,
    trigger_value: input.triggerValue,
    trigger_field: input.triggerField || null,
    order_type: input.orderType,
    scheme_id: input.schemeId,
    scheme_name: schemeName,
    amount: input.amount || null,
    units: input.units || null,
    target_scheme_id: input.targetSchemeId || null,
    target_scheme_name: targetSchemeName || null,
    goal_id: input.goalId || null,
    goal_name: goalName,
    valid_from: input.validFrom,
    valid_until: input.validUntil || null,
    status: 'Active',
    is_enabled: true,
    created_by: userId,
  };

  const { data: order, error } = await supabaseServer
    .from('trigger_orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create trigger order: ${error.message}`);
  }

  return mapTriggerOrderFromDB(order);
}

/**
 * Get all trigger orders for a client
 */
export async function getTriggerOrders(clientId: number): Promise<TriggerOrder[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: orders, error } = await supabaseServer
    .from('trigger_orders')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch trigger orders: ${error.message}`);
  }

  return (orders || []).map(mapTriggerOrderFromDB);
}

/**
 * Get a single trigger order by ID
 */
export async function getTriggerOrderById(orderId: string): Promise<TriggerOrder | null> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: order, error } = await supabaseServer
    .from('trigger_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch trigger order: ${error.message}`);
  }

  return mapTriggerOrderFromDB(order);
}

/**
 * Check and execute trigger orders (called by scheduler)
 */
export async function checkTriggerOrders(clientId?: number): Promise<TriggerOrder[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  let query = supabaseServer
    .from('trigger_orders')
    .select('*')
    .eq('status', 'Active')
    .eq('is_enabled', true);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: orders, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch trigger orders: ${error.message}`);
  }

  const triggeredOrders: TriggerOrder[] = [];

  for (const orderData of orders || []) {
    const order = mapTriggerOrderFromDB(orderData);
    
    // Check if trigger conditions are met
    const isTriggered = await checkTriggerCondition(order);
    
    if (isTriggered) {
      // Execute the order
      const result = await executeTriggerOrder(order.id);
      if (result.success) {
        triggeredOrders.push(order);
      }
    }
  }

  return triggeredOrders;
}

/**
 * Check if a trigger condition is met
 */
async function checkTriggerCondition(order: TriggerOrder): Promise<boolean> {
  // Check validity dates
  if (new Date() < new Date(order.validFrom)) {
    return false;
  }
  if (order.validUntil && new Date() > new Date(order.validUntil)) {
    await supabaseServer
      .from('trigger_orders')
      .update({ status: 'Expired' })
      .eq('id', order.id);
    return false;
  }

  // This would check actual market/portfolio values
  // For now, return false (would need market data service)
  return false;
}

/**
 * Execute a trigger order
 */
async function executeTriggerOrder(orderId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const order = await getTriggerOrderById(orderId);
  if (!order) {
    return { success: false, error: 'Trigger order not found' };
  }

  try {
    // Create order (would integrate with order service)
    const executedOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await supabaseServer
      .from('trigger_orders')
      .update({
        status: 'Executed',
        triggered_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
        executed_order_id: executedOrderId,
        execution_status: 'Success',
      })
      .eq('id', orderId);

    await logAutomationExecution({
      automationType: 'TriggerOrder',
      automationId: orderId,
      clientId: order.clientId,
      status: 'Success',
      orderId: executedOrderId,
    });

    return { success: true, orderId: executedOrderId };
  } catch (error: any) {
    await supabaseServer
      .from('trigger_orders')
      .update({
        execution_status: 'Failed',
        execution_error: error.message,
      })
      .eq('id', orderId);

    await logAutomationExecution({
      automationType: 'TriggerOrder',
      automationId: orderId,
      clientId: order.clientId,
      status: 'Failed',
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

// ============================================================================
// Execution Logging
// ============================================================================

/**
 * Log automation execution
 */
async function logAutomationExecution(log: {
  automationType: 'AutoInvest' | 'Rebalancing' | 'TriggerOrder';
  automationId: string;
  clientId: number;
  status: 'Success' | 'Failed' | 'Skipped';
  orderId?: string;
  error?: string;
}): Promise<void> {
  if (!supabaseServer) return;

  const logId = generateId('LOG');
  
  await supabaseServer
    .from('automation_execution_logs')
    .insert({
      id: logId,
      automation_type: log.automationType,
      automation_id: log.automationId,
      client_id: log.clientId,
      execution_date: new Date().toISOString().slice(0, 10),
      status: log.status,
      order_id: log.orderId || null,
      error: log.error || null,
      details: {},
    });
}

/**
 * Get automation execution logs
 */
export async function getAutomationExecutionLogs(
  clientId: number,
  automationType?: string,
  automationId?: string
): Promise<AutomationExecutionLog[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  let query = supabaseServer
    .from('automation_execution_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (automationType) {
    query = query.eq('automation_type', automationType);
  }
  if (automationId) {
    query = query.eq('automation_id', automationId);
  }

  const { data: logs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch execution logs: ${error.message}`);
  }

  return (logs || []).map((log: any) => ({
    id: log.id,
    automationType: log.automation_type,
    automationId: log.automation_id,
    clientId: log.client_id,
    executionDate: log.execution_date,
    status: log.status,
    orderId: log.order_id,
    error: log.error,
    details: log.details || {},
    createdAt: log.created_at,
  }));
}

// ============================================================================
// Database Mapping Functions
// ============================================================================

function mapAutoInvestRuleFromDB(data: any): AutoInvestRule {
  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    description: data.description,
    schemeId: data.scheme_id,
    schemeName: data.scheme_name,
    amount: data.amount,
    frequency: data.frequency,
    triggerType: data.trigger_type,
    triggerConfig: data.trigger_config || {},
    goalId: data.goal_id,
    goalName: data.goal_name,
    startDate: data.start_date,
    endDate: data.end_date,
    nextExecutionDate: data.next_execution_date,
    status: data.status,
    isEnabled: data.is_enabled,
    maxTotalAmount: data.max_total_amount,
    maxPerExecution: data.max_per_execution,
    minBalanceRequired: data.min_balance_required,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    executionCount: data.execution_count || 0,
    lastExecutionDate: data.last_execution_date,
    lastExecutionStatus: data.last_execution_status,
    lastExecutionError: data.last_execution_error,
  };
}

function mapRebalancingRuleFromDB(data: any): RebalancingRule {
  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    description: data.description,
    strategy: data.strategy,
    targetAllocation: data.target_allocation || {},
    thresholdPercent: data.threshold_percent,
    rebalanceAmount: data.rebalance_amount,
    frequency: data.frequency,
    dayOfMonth: data.day_of_month,
    dayOfWeek: data.day_of_week,
    triggerOnDrift: data.trigger_on_drift,
    triggerOnSchedule: data.trigger_on_schedule,
    minDriftPercent: data.min_drift_percent,
    executeAutomatically: data.execute_automatically,
    requireConfirmation: data.require_confirmation,
    status: data.status,
    isEnabled: data.is_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastRebalancedDate: data.last_rebalanced_date,
    nextRebalancingDate: data.next_rebalancing_date,
    executionCount: data.execution_count || 0,
    lastExecutionStatus: data.last_execution_status,
  };
}

function mapTriggerOrderFromDB(data: any): TriggerOrder {
  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    description: data.description,
    triggerType: data.trigger_type,
    triggerCondition: data.trigger_condition,
    triggerValue: data.trigger_value,
    triggerField: data.trigger_field,
    orderType: data.order_type,
    schemeId: data.scheme_id,
    schemeName: data.scheme_name,
    amount: data.amount,
    units: data.units,
    targetSchemeId: data.target_scheme_id,
    targetSchemeName: data.target_scheme_name,
    goalId: data.goal_id,
    goalName: data.goal_name,
    validFrom: data.valid_from,
    validUntil: data.valid_until,
    status: data.status,
    isEnabled: data.is_enabled,
    triggeredAt: data.triggered_at,
    executedAt: data.executed_at,
    executedOrderId: data.executed_order_id,
    executionStatus: data.execution_status,
    executionError: data.execution_error,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

