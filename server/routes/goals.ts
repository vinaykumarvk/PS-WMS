import { Request, Response } from 'express';
import * as goalService from '../services/goal-service';

/**
 * Create a new goal
 * POST /api/goals
 */
export async function createGoal(req: Request, res: Response) {
  try {
    const {
      clientId,
      name,
      type,
      targetAmount,
      targetDate,
      monthlyContribution,
      schemes,
      description,
      priority,
    } = req.body;

    // Validation
    if (!clientId || !name || !type || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, name, type, targetAmount, targetDate',
      });
    }

    if (targetAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be greater than 0',
      });
    }

    const goal = await goalService.createGoal({
      clientId,
      name,
      type,
      targetAmount,
      targetDate,
      monthlyContribution,
      schemes,
      description,
      priority,
    });

    return res.status(201).json({
      success: true,
      data: goal,
      message: 'Goal created successfully',
    });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create goal',
    });
  }
}

/**
 * Get all goals for a client
 * GET /api/goals?clientId=123
 */
export async function getGoals(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const goals = await goalService.getGoals(clientId);

    return res.json({
      success: true,
      data: goals,
    });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch goals',
    });
  }
}

/**
 * Get a single goal by ID
 * GET /api/goals/:id
 */
export async function getGoalById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Goal ID is required',
      });
    }

    const goal = await goalService.getGoalById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    return res.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    console.error('Error fetching goal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch goal',
    });
  }
}

/**
 * Update a goal
 * PUT /api/goals/:id
 */
export async function updateGoal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Goal ID is required',
      });
    }

    const goal = await goalService.updateGoal(id, updates);

    return res.json({
      success: true,
      data: goal,
      message: 'Goal updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update goal',
    });
  }
}

/**
 * Delete a goal
 * DELETE /api/goals/:id
 */
export async function deleteGoal(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Goal ID is required',
      });
    }

    await goalService.deleteGoal(id);

    return res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete goal',
    });
  }
}

/**
 * Allocate an order/transaction to a goal
 * POST /api/goals/:id/allocate
 */
export async function allocateToGoal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { transactionId, amount, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Goal ID is required',
      });
    }

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'transactionId and amount are required',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    await goalService.allocateToGoal(id, transactionId, amount, notes);

    return res.json({
      success: true,
      message: 'Order allocated to goal successfully',
    });
  } catch (error: any) {
    console.error('Error allocating to goal:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to allocate to goal',
    });
  }
}

/**
 * Get goal progress
 * GET /api/goals/:id/progress
 */
export async function getGoalProgress(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Goal ID is required',
      });
    }

    const progress = await goalService.getGoalProgress(id);

    return res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error fetching goal progress:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch goal progress',
    });
  }
}

/**
 * Get goal recommendations
 * GET /api/goals/recommendations?clientId=123
 */
export async function getGoalRecommendations(req: Request, res: Response) {
  try {
    const clientId = parseInt(req.query.clientId as string);

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid clientId query parameter is required',
      });
    }

    const recommendations = await goalService.getGoalRecommendations(clientId);

    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching goal recommendations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch goal recommendations',
    });
  }
}

