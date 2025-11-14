import React, { useState } from 'react';
import { useGoals } from '../../hooks/use-goals';
import GoalCard from './goal-card';
import GoalCreationWizard from './goal-creation-wizard';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Goal, GoalType } from '../../../../../../shared/types/order-management.types';

interface GoalTrackingDashboardProps {
  clientId: number | null;
  onGoalSelect?: (goal: Goal) => void;
}

export default function GoalTrackingDashboard({
  clientId,
  onGoalSelect,
}: GoalTrackingDashboardProps) {
  const { goals = [], isLoadingGoals, deleteGoal } = useGoals(clientId || undefined);
  const deleteGoalMutation = deleteGoal;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const goalTypes: GoalType[] = [
    'Retirement',
    'Child Education',
    'House Purchase',
    'Vacation',
    'Emergency Fund',
    'Other',
  ];

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    const matchesType = typeFilter === 'all' || goal.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async () => {
    if (deleteGoalId) {
      await deleteGoalMutation.mutateAsync(deleteGoalId);
      setDeleteGoalId(null);
    }
  };

  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === 'Active').length,
    completed: goals.filter((g) => g.status === 'Completed').length,
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrent: goals.reduce((sum, g) => sum + g.currentAmount, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!clientId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please select a client to view goals
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">
            Track and manage your financial goals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

       {/* Stats */}
       {!isLoadingGoals && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Goals</p>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Target</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalTarget)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalCurrent)}</p>
            <p className="text-xs text-muted-foreground">
              {((stats.totalCurrent / stats.totalTarget) * 100).toFixed(1)}% of target
            </p>
          </div>
        </div>
      )}

       {/* Filters */}
       {!isLoadingGoals && goals.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {goalTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Goals Grid */}
      {isLoadingGoals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          title={goals.length === 0 ? 'No goals yet' : 'No goals found'}
          description={
            goals.length === 0
              ? 'Create your first financial goal to get started'
              : 'Try adjusting your filters'
          }
          action={
            goals.length === 0 ? (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onViewDetails={onGoalSelect ? () => onGoalSelect(goal) : undefined}
              onDelete={(id) => setDeleteGoalId(id)}
            />
          ))}
        </div>
      )}

      {/* Create Goal Dialog */}
      {clientId && (
        <GoalCreationWizard
          clientId={clientId}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
