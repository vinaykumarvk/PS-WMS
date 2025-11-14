import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGoals, CreateGoalInput } from '../../hooks/use-goals';
import { GoalType } from '../../../../../../shared/types/order-management.types';
import { Loader2 } from 'lucide-react';

interface GoalCreationWizardProps {
  clientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const goalTypes: GoalType[] = [
  'Retirement',
  'Child Education',
  'House Purchase',
  'Vacation',
  'Emergency Fund',
  'Other',
];

const priorities = ['Low', 'Medium', 'High'] as const;

export default function GoalCreationWizard({
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: GoalCreationWizardProps) {
  const { createGoal } = useGoals(clientId);
  const createGoalMutation = createGoal;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: '' as GoalType | '',
    targetAmount: '',
    targetDate: '',
    monthlyContribution: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    schemes: [] as { schemeId: number; allocation: number }[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Goal type is required';
    }
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Valid target amount is required';
    }
    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      if (targetDate <= new Date()) {
        newErrors.targetDate = 'Target date must be in the future';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    try {
      const goalInput: CreateGoalInput = {
        clientId,
        name: formData.name,
        type: formData.type as GoalType,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate,
        monthlyContribution: formData.monthlyContribution
          ? parseFloat(formData.monthlyContribution)
          : undefined,
        description: formData.description || undefined,
        priority: formData.priority,
        schemes: formData.schemes.length > 0 ? formData.schemes : undefined,
      };
      await createGoalMutation.mutateAsync(goalInput);

      // Reset form
      setFormData({
        name: '',
        type: '' as GoalType | '',
        targetAmount: '',
        targetDate: '',
        monthlyContribution: '',
        description: '',
        priority: 'Medium',
        schemes: [],
      });
      setStep(1);
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    return num;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Step {step} of 2: {step === 1 ? 'Basic Information' : 'Additional Details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Goal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Retirement Fund, Child's Education"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Goal Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as GoalType })
                  }
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">
                    Target Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetAmount"
                    type="text"
                    value={formData.targetAmount}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setFormData({ ...formData, targetAmount: formatted });
                    }}
                    placeholder="500000"
                    className={errors.targetAmount ? 'border-red-500' : ''}
                  />
                  {errors.targetAmount && (
                    <p className="text-sm text-red-500">{errors.targetAmount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">
                    Target Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDate: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.targetDate ? 'border-red-500' : ''}
                  />
                  {errors.targetDate && (
                    <p className="text-sm text-red-500">{errors.targetDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">
                  Monthly Contribution (₹) <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="monthlyContribution"
                  type="text"
                  value={formData.monthlyContribution}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setFormData({ ...formData, monthlyContribution: formatted });
                  }}
                  placeholder="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Expected monthly investment towards this goal
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as 'Low' | 'Medium' | 'High',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add any additional notes about this goal..."
                  rows={4}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Scheme allocations can be configured after creating the goal.
                  You can edit the goal to add specific scheme allocations.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step < 2 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Goal
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
