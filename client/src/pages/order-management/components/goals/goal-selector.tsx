/**
 * Goal Selector Component
 * Allows selecting a goal when placing an order
 */

import React from 'react';
import { Target, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoals } from '../../hooks/use-goals';
import { Goal } from '../../../../../../shared/types/order-management.types';
import { cn } from '@/lib/utils';

interface GoalSelectorProps {
  clientId: number;
  selectedGoalId?: string;
  onGoalSelect?: (goalId: string | null) => void;
  onCreateGoal?: () => void;
  className?: string;
  showLabel?: boolean;
}

export default function GoalSelector({
  clientId,
  selectedGoalId,
  onGoalSelect,
  onCreateGoal,
  className,
  showLabel = true,
}: GoalSelectorProps) {
  const { goals, isLoadingGoals } = useGoals(clientId);
  const activeGoals = goals.filter((g) => g.status === 'Active');

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  if (isLoadingGoals) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>Loading goals...</div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Allocate to Goal (Optional)
          </label>
          {onCreateGoal && (
            <Button variant="ghost" size="sm" onClick={onCreateGoal}>
              <Plus className="h-4 w-4 mr-1" />
              New Goal
            </Button>
          )}
        </div>
      )}
      <Select value={selectedGoalId || 'none'} onValueChange={(value) => onGoalSelect?.(value === 'none' ? null : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a goal (optional)">
            {selectedGoal ? (
              <div className="flex items-center gap-2">
                <span>{selectedGoal.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(selectedGoal.progress)}%)
                </span>
              </div>
            ) : (
              'Select a goal (optional)'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Goal</SelectItem>
          {activeGoals.length === 0 ? (
            <SelectItem value="no-goals" disabled>
              No active goals available
            </SelectItem>
          ) : (
            activeGoals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{goal.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {Math.round(goal.progress)}%
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {selectedGoal && (
        <Card className="mt-2">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">
                  ₹{new Intl.NumberFormat('en-IN').format(selectedGoal.targetAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">
                  ₹{new Intl.NumberFormat('en-IN').format(selectedGoal.currentAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{Math.round(selectedGoal.progress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
