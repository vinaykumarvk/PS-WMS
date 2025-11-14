import { Request, Response } from 'express';
import * as automationService from '../services/automation-service';
import * as notificationService from '../services/notification-service';

/**
 * Create a new auto-invest rule
 * POST /api/automation/auto-invest
 */
export async function createAutoInvestRule(req: Request, res: Response) {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const rule = await automationService.createAutoInvestRule(req.body, userId);

    return res.status(201).json({
      success: true,
      data: rule,
      message: 'Auto-invest rule created successfully',
    });
  } catch (error: any) {
    console.error('Error creating auto-invest rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create auto-invest rule',
    });
  }
}

/**
 * Get all auto-invest rules for a client
 * GET /api/automation/auto-invest?clientId=123
 */
export async function getAutoInvestRules(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const rules = await automationService.getAutoInvestRules(clientId);

    return res.json({
      success: true,
      data: rules,
    });
  } catch (error: any) {
    console.error('Error fetching auto-invest rules:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch auto-invest rules',
    });
  }
}

/**
 * Get a single auto-invest rule by ID
 * GET /api/automation/auto-invest/:id
 */
export async function getAutoInvestRuleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID is required',
      });
    }

    const rule = await automationService.getAutoInvestRuleById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Auto-invest rule not found',
      });
    }

    return res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error fetching auto-invest rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch auto-invest rule',
    });
  }
}

/**
 * Update an auto-invest rule
 * PUT /api/automation/auto-invest/:id
 */
export async function updateAutoInvestRule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID is required',
      });
    }

    const rule = await automationService.updateAutoInvestRule(id, updates);

    return res.json({
      success: true,
      data: rule,
      message: 'Auto-invest rule updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating auto-invest rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update auto-invest rule',
    });
  }
}

/**
 * Delete an auto-invest rule
 * DELETE /api/automation/auto-invest/:id
 */
export async function deleteAutoInvestRule(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID is required',
      });
    }

    await automationService.deleteAutoInvestRule(id);

    return res.json({
      success: true,
      message: 'Auto-invest rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting auto-invest rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete auto-invest rule',
    });
  }
}

// ============================================================================
// Rebalancing Automation Routes
// ============================================================================

/**
 * Create a rebalancing rule
 * POST /api/automation/rebalancing
 */
export async function createRebalancingRule(req: Request, res: Response) {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const rule = await automationService.createRebalancingRule(req.body, userId);

    return res.status(201).json({
      success: true,
      data: rule,
      message: 'Rebalancing rule created successfully',
    });
  } catch (error: any) {
    console.error('Error creating rebalancing rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create rebalancing rule',
    });
  }
}

/**
 * Get all rebalancing rules for a client
 * GET /api/automation/rebalancing?clientId=123
 */
export async function getRebalancingRules(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const rules = await automationService.getRebalancingRules(clientId);

    return res.json({
      success: true,
      data: rules,
    });
  } catch (error: any) {
    console.error('Error fetching rebalancing rules:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rebalancing rules',
    });
  }
}

/**
 * Get a single rebalancing rule by ID
 * GET /api/automation/rebalancing/:id
 */
export async function getRebalancingRuleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID is required',
      });
    }

    const rule = await automationService.getRebalancingRuleById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Rebalancing rule not found',
      });
    }

    return res.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error fetching rebalancing rule:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rebalancing rule',
    });
  }
}

/**
 * Execute rebalancing
 * POST /api/automation/rebalancing/:id/execute
 */
export async function executeRebalancing(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req.session as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID is required',
      });
    }

    const execution = await automationService.executeRebalancing(id, userId);

    return res.json({
      success: true,
      data: execution,
      message: 'Rebalancing executed successfully',
    });
  } catch (error: any) {
    console.error('Error executing rebalancing:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute rebalancing',
    });
  }
}

// ============================================================================
// Trigger Orders Routes
// ============================================================================

/**
 * Create a trigger order
 * POST /api/automation/trigger-orders
 */
export async function createTriggerOrder(req: Request, res: Response) {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const order = await automationService.createTriggerOrder(req.body, userId);

    return res.status(201).json({
      success: true,
      data: order,
      message: 'Trigger order created successfully',
    });
  } catch (error: any) {
    console.error('Error creating trigger order:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create trigger order',
    });
  }
}

/**
 * Get all trigger orders for a client
 * GET /api/automation/trigger-orders?clientId=123
 */
export async function getTriggerOrders(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const orders = await automationService.getTriggerOrders(clientId);

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Error fetching trigger orders:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trigger orders',
    });
  }
}

/**
 * Get a single trigger order by ID
 * GET /api/automation/trigger-orders/:id
 */
export async function getTriggerOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const order = await automationService.getTriggerOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Trigger order not found',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error fetching trigger order:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trigger order',
    });
  }
}

// ============================================================================
// Notification Preferences Routes
// ============================================================================

/**
 * Create a notification preference
 * POST /api/automation/notification-preferences
 */
export async function createNotificationPreference(req: Request, res: Response) {
  try {
    const preference = await notificationService.createNotificationPreference(req.body);

    return res.status(201).json({
      success: true,
      data: preference,
      message: 'Notification preference created successfully',
    });
  } catch (error: any) {
    console.error('Error creating notification preference:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create notification preference',
    });
  }
}

/**
 * Get notification preferences
 * GET /api/automation/notification-preferences?clientId=123&userId=456
 */
export async function getNotificationPreferences(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const preferences = await notificationService.getNotificationPreferences(clientId, userId);

    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notification preferences',
    });
  }
}

/**
 * Update a notification preference
 * PUT /api/automation/notification-preferences/:id
 */
export async function updateNotificationPreference(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Preference ID is required',
      });
    }

    const preference = await notificationService.updateNotificationPreference(id, updates);

    return res.json({
      success: true,
      data: preference,
      message: 'Notification preference updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating notification preference:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update notification preference',
    });
  }
}

/**
 * Delete a notification preference
 * DELETE /api/automation/notification-preferences/:id
 */
export async function deleteNotificationPreference(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Preference ID is required',
      });
    }

    await notificationService.deleteNotificationPreference(id);

    return res.json({
      success: true,
      message: 'Notification preference deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting notification preference:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification preference',
    });
  }
}

/**
 * Get notification logs
 * GET /api/automation/notification-logs?clientId=123&event=Order+Executed
 */
export async function getNotificationLogs(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);
    const event = req.query.event as string | undefined;
    const channel = req.query.channel as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const logs = await notificationService.getNotificationLogs(clientId, event, channel as any, limit);

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error fetching notification logs:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notification logs',
    });
  }
}

// ============================================================================
// Execution Logs Routes
// ============================================================================

/**
 * Get automation execution logs
 * GET /api/automation/execution-logs?clientId=123&automationType=AutoInvest
 */
export async function getAutomationExecutionLogs(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);
    const automationType = req.query.automationType as string | undefined;
    const automationId = req.query.automationId as string | undefined;

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const logs = await automationService.getAutomationExecutionLogs(
      clientId,
      automationType,
      automationId
    );

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error fetching execution logs:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch execution logs',
    });
  }
}

// ============================================================================
// Scheduler Control Routes (Admin/Testing)
// ============================================================================

/**
 * Manually trigger automation execution
 * POST /api/automation/scheduler/execute
 */
export async function manualExecuteAutomation(req: Request, res: Response) {
  try {
    const { type, ruleId, clientId } = req.body;
    const schedulerService = require('../services/automation-scheduler-service');

    if (type === 'auto-invest' && ruleId) {
      const result = await schedulerService.manualExecuteAutoInvest(ruleId);
      return res.json({
        success: result.success,
        message: result.message,
      });
    } else if (type === 'rebalancing' && ruleId) {
      const result = await schedulerService.manualCheckRebalancing(ruleId);
      return res.json({
        success: true,
        data: result,
      });
    } else if (type === 'triggers') {
      const result = await schedulerService.manualCheckTriggers(clientId);
      return res.json({
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type or missing ruleId',
      });
    }
  } catch (error: any) {
    console.error('Error in manual execution:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute automation',
    });
  }
}

/**
 * Get scheduler status
 * GET /api/automation/scheduler/status
 */
export async function getSchedulerStatus(req: Request, res: Response) {
  try {
    const schedulerService = require('../services/automation-scheduler-service');
    const isRunning = schedulerService.isSchedulerRunning();

    return res.json({
      success: true,
      data: {
        isRunning,
        checkInterval: process.env.AUTOMATION_CHECK_INTERVAL || '3600000',
      },
    });
  } catch (error: any) {
    console.error('Error getting scheduler status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get scheduler status',
    });
  }
}

