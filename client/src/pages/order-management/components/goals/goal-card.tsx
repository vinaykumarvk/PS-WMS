import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  PauseCircle,
  XCircle
} from 'lucide-react';
import { Goal, GoalType } from '../../../../../../shared/types/order-management.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onViewDetails?: (goalId: string) => void;
  showActions?: boolean;
}

const goalTypeIcons: Record<GoalType, string> = {
  'Retirement': '🏖️',
  'Child Education': '🎓',
  'House Purchase': '🏠',
  'Vacation': '✈️',
  'Emergency Fund': '💰',
  'Other': '🎯',
};

const goalTypeColors: Record<GoalType, string> = {
  'Retirement': 'bg-orange-100 text-orange-800',
  'Child Education': 'bg-blue-100 text-blue-800',
  'House Purchase': 'bg-green-100 text-green-800',
  'Vacation': 'bg-purple-100 text-purple-800',
  'Emergency Fund': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800',
};

const statusConfig = {
  Active: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  Completed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  Paused: { icon: PauseCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  Cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const priorityColors = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onViewDetails,
  showActions = true,
}: GoalCardProps) {
  const StatusIcon = statusConfig[goal.status].icon;
  const statusColor = statusConfig[goal.status].color;
  const statusBg = statusConfig[goal.status].bg;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const monthsRemaining = () => {
    const target = new Date(goal.targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const shortfall = goal.targetAmount - goal.currentAmount;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl">{goalTypeIcons[goal.type]}</div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {goal.name}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={goalTypeColors[goal.type]}>
                  {goal.type}
                </Badge>
                <Badge variant="outline" className={priorityColors[goal.priority]}>
                  {goal.priority} Priority
                </Badge>
                <div className={`flex items-center gap-1 ${statusColor}`}>
                  <StatusIcon className="h-3 w-3" />
                  <span className="text-xs font-medium">{goal.status}</span>
                </div>
              </CardDescription>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(goal.id)}>
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(goal.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(goal.currentAmount)}</span>
            <span>{formatCurrency(goal.targetAmount)}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Target Date</span>
            </div>
            <p className="text-sm font-medium">{formatDate(goal.targetDate)}</p>
            <p className="text-xs text-muted-foreground">
              {monthsRemaining()} months remaining
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Shortfall</span>
            </div>
            <p className="text-sm font-medium text-red-600">
              {formatCurrency(shortfall)}
            </p>
            {goal.monthlyContribution && (
              <p className="text-xs text-muted-foreground">
                ₹{goal.monthlyContribution.toLocaleString()}/month
              </p>
            )}
          </div>
        </div>

        {/* Scheme Allocations */}
        {goal.schemes && goal.schemes.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Scheme Allocations</p>
            <div className="flex flex-wrap gap-1">
              {goal.schemes.map((scheme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  Scheme {scheme.schemeId}: {scheme.allocation}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
            {goal.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
