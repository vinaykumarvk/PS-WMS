import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GoalSelector from './goal-selector';
import { useGoals, useGoal, useGoalProgress } from '../../hooks/use-goals';
import { Loader2 } from 'lucide-react';

interface GoalAllocationProps {
  clientId: number | null;
  transactionId: number;
  transactionAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function GoalAllocation({
  clientId,
  transactionId,
  transactionAmount,
  open,
  onOpenChange,
  onSuccess,
}: GoalAllocationProps) {
  const { allocateToGoal } = useGoals(clientId || undefined);
  const allocateMutation = allocateToGoal;
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [allocationAmount, setAllocationAmount] = useState<string>(
    transactionAmount.toString()
  );
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: goal } = useGoal(selectedGoalId || null);
  const { data: progress } = useGoalProgress(selectedGoalId || null);

  const handleAllocate = async () => {
    const errors: Record<string, string> = {};

    if (!selectedGoalId) {
      errors.goal = 'Please select a goal';
    }

    const amount = parseFloat(allocationAmount);
    if (!allocationAmount || isNaN(amount) || amount <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (amount > transactionAmount) {
      errors.amount = `Amount cannot exceed transaction amount of ₹${transactionAmount.toLocaleString()}`;
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await allocateMutation.mutateAsync({
        goalId: selectedGoalId,
        transactionId,
        amount,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setSelectedGoalId('');
      setAllocationAmount(transactionAmount.toString());
      setNotes('');
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Allocate to Goal</DialogTitle>
          <DialogDescription>
            Link this transaction to a financial goal to track progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transaction Amount</span>
              <span className="text-lg font-semibold">
                {formatCurrency(transactionAmount)}
              </span>
            </div>
          </div>

          {/* Goal Selection */}
          <div className="space-y-2">
            <Label htmlFor="goal">
              Select Goal <span className="text-red-500">*</span>
            </Label>
            <GoalSelector
              clientId={clientId || 0}
              selectedGoalId={selectedGoalId}
              onGoalSelect={(goalId) => setSelectedGoalId(goalId || '')}
            />
            {errors.goal && (
              <p className="text-sm text-red-500">{errors.goal}</p>
            )}
            {selectedGoalId && goal && progress && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Progress</span>
                  <span className="font-medium">{progress.progress.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">
                    {formatCurrency(progress.currentAmount)}
                  </span>
                  <span className="text-muted-foreground">
                    of {formatCurrency(progress.targetAmount)}
                  </span>
                </div>
                {!progress.onTrack && progress.shortfall && (
                  <p className="text-xs text-orange-600 mt-1">
                    Shortfall: {formatCurrency(progress.shortfall)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Allocation Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Allocation Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="text"
              value={allocationAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setAllocationAmount(value);
              }}
              placeholder="Enter amount"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum: {formatCurrency(transactionAmount)}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this allocation..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAllocate} disabled={allocateMutation.isPending}>
              {allocateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Allocate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

