import { supabaseServer } from '../lib/supabase';
import { Goal, GoalProgress, GoalRecommendation } from '@shared/types/order-management.types';

/**
 * Generate a unique goal ID
 */
function generateGoalId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `GOAL-${dateStr}-${random}`;
}

/**
 * Calculate goal progress
 */
function calculateProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 0;
  return Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100));
}

/**
 * Calculate months remaining until target date
 */
function calculateMonthsRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.max(0, diffMonths);
}

/**
 * Check if goal is on track
 */
function isOnTrack(
  currentAmount: number,
  targetAmount: number,
  targetDate: string,
  monthlyContribution?: number
): boolean {
  const monthsRemaining = calculateMonthsRemaining(targetDate);
  if (monthsRemaining === 0) return currentAmount >= targetAmount;
  
  if (monthlyContribution) {
    const projectedAmount = currentAmount + (monthlyContribution * monthsRemaining);
    return projectedAmount >= targetAmount;
  }
  
  // If no monthly contribution, check if current progress matches time elapsed
  const totalMonths = calculateMonthsRemaining(targetDate);
  const progressPercent = calculateProgress(currentAmount, targetAmount);
  const timeElapsedPercent = totalMonths > 0 ? (1 - monthsRemaining / totalMonths) * 100 : 0;
  
  return progressPercent >= timeElapsedPercent;
}

/**
 * Create a new goal
 */
export async function createGoal(data: {
  clientId: number;
  name: string;
  type: string;
  targetAmount: number;
  targetDate: string;
  monthlyContribution?: number;
  schemes?: { schemeId: number; allocation: number }[];
  description?: string;
  priority?: string;
}): Promise<Goal> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const goalId = generateGoalId();
  const progress = calculateProgress(0, data.targetAmount);

  const goalData = {
    id: goalId,
    client_id: data.clientId,
    name: data.name,
    type: data.type,
    target_amount: data.targetAmount,
    target_date: data.targetDate,
    current_amount: 0,
    monthly_contribution: data.monthlyContribution || null,
    schemes: data.schemes || [],
    progress,
    status: 'Active',
    description: data.description || null,
    priority: data.priority || 'Medium',
  };

  const { data: goal, error } = await supabaseServer
    .from('goals')
    .insert(goalData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return mapGoalFromDB(goal);
}

/**
 * Get all goals for a client
 */
export async function getGoals(clientId: number): Promise<Goal[]> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: goals, error } = await supabaseServer
    .from('goals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return goals.map(mapGoalFromDB);
}

/**
 * Get a single goal by ID
 */
export async function getGoalById(goalId: string): Promise<Goal | null> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { data: goal, error } = await supabaseServer
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch goal: ${error.message}`);
  }

  return mapGoalFromDB(goal);
}

/**
 * Update a goal
 */
export async function updateGoal(
  goalId: string,
  updates: Partial<{
    name: string;
    type: string;
    targetAmount: number;
    targetDate: string;
    monthlyContribution: number;
    schemes: { schemeId: number; allocation: number }[];
    description: string;
    priority: string;
    status: string;
  }>
): Promise<Goal> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.type) updateData.type = updates.type;
  if (updates.targetAmount !== undefined) {
    updateData.target_amount = updates.targetAmount;
    // Recalculate progress if target amount changed
    const goal = await getGoalById(goalId);
    if (goal) {
      updateData.progress = calculateProgress(goal.currentAmount, updates.targetAmount);
    }
  }
  if (updates.targetDate) updateData.target_date = updates.targetDate;
  if (updates.monthlyContribution !== undefined) {
    updateData.monthly_contribution = updates.monthlyContribution;
  }
  if (updates.schemes) updateData.schemes = updates.schemes;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.status) {
    updateData.status = updates.status;
    if (updates.status === 'Completed') {
      updateData.completed_at = new Date().toISOString();
    }
  }

  const { data: goal, error } = await supabaseServer
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return mapGoalFromDB(goal);
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  const { error } = await supabaseServer
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}

/**
 * Allocate an order/transaction to a goal
 */
export async function allocateToGoal(
  goalId: string,
  transactionId: number,
  amount: number,
  notes?: string
): Promise<void> {
  if (!supabaseServer) {
    throw new Error('Database connection not available');
  }

  // Get current goal
  const goal = await getGoalById(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }

  // Create allocation record
  const { error: allocError } = await supabaseServer
    .from('goal_allocations')
    .insert({
      goal_id: goalId,
      transaction_id: transactionId,
      amount,
      notes: notes || null,
    });

  if (allocError) {
    throw new Error(`Failed to create allocation: ${allocError.message}`);
  }

  // Update goal current amount and progress
  const newCurrentAmount = goal.currentAmount + amount;
  const newProgress = calculateProgress(newCurrentAmount, goal.targetAmount);

  const { error: updateError } = await supabaseServer
    .from('goals')
    .update({
      current_amount: newCurrentAmount,
      progress: newProgress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId);

  if (updateError) {
    throw new Error(`Failed to update goal: ${updateError.message}`);
  }
}

/**
 * Get goal progress details
 */
export async function getGoalProgress(goalId: string): Promise<GoalProgress> {
  const goal = await getGoalById(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }

  const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
  const onTrack = isOnTrack(
    goal.currentAmount,
    goal.targetAmount,
    goal.targetDate,
    goal.monthlyContribution
  );

  const shortfall = goal.targetAmount - goal.currentAmount;
  const projectedCompletion = goal.monthlyContribution && monthsRemaining > 0
    ? new Date(Date.now() + monthsRemaining * 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return {
    goalId: goal.id,
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
    progress: goal.progress,
    monthsRemaining,
    projectedCompletion,
    onTrack,
    shortfall: shortfall > 0 ? shortfall : undefined,
  };
}

/**
 * Get goal recommendations based on client portfolio and goals
 */
export async function getGoalRecommendations(clientId: number): Promise<GoalRecommendation[]> {
  const goals = await getGoals(clientId);
  const activeGoals = goals.filter(g => g.status === 'Active');

  const recommendations: GoalRecommendation[] = [];

  for (const goal of activeGoals) {
    const progress = await getGoalProgress(goal.id);
    
    // Determine priority based on progress and time remaining
    let priority: 'High' | 'Medium' | 'Low' = 'Medium';
    if (!progress.onTrack && progress.monthsRemaining < 12) {
      priority = 'High';
    } else if (progress.onTrack && progress.monthsRemaining > 24) {
      priority = 'Low';
    }

    // Calculate recommended amount based on shortfall and months remaining
    let recommendedAmount = 0;
    if (progress.shortfall && progress.monthsRemaining > 0) {
      recommendedAmount = Math.ceil(progress.shortfall / progress.monthsRemaining);
    } else if (goal.monthlyContribution) {
      recommendedAmount = goal.monthlyContribution;
    }

    // Generate scheme recommendations based on goal type and schemes
    const recommendedSchemes = goal.schemes.map(scheme => ({
      schemeId: scheme.schemeId,
      schemeName: `Scheme ${scheme.schemeId}`, // Would fetch actual name in real implementation
      allocation: scheme.allocation,
      reason: `Aligned with goal allocation strategy`,
    }));

    recommendations.push({
      goalId: goal.id,
      goalName: goal.name,
      recommendedAmount,
      recommendedSchemes,
      reason: progress.onTrack
        ? `Goal is on track. Continue with current contribution plan.`
        : `Goal needs additional contribution of ₹${recommendedAmount.toLocaleString()} per month to stay on track.`,
      priority,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Map database goal to application Goal type
 */
function mapGoalFromDB(dbGoal: any): Goal {
  return {
    id: dbGoal.id,
    clientId: dbGoal.client_id,
    name: dbGoal.name,
    type: dbGoal.type,
    targetAmount: dbGoal.target_amount,
    targetDate: dbGoal.target_date,
    currentAmount: dbGoal.current_amount || 0,
    monthlyContribution: dbGoal.monthly_contribution,
    schemes: dbGoal.schemes || [],
    progress: dbGoal.progress || 0,
    status: dbGoal.status || 'Active',
    description: dbGoal.description,
    priority: dbGoal.priority || 'Medium',
    createdAt: dbGoal.created_at,
    updatedAt: dbGoal.updated_at,
    completedAt: dbGoal.completed_at,
  };
}

