/**
 * Goal Timeline Component
 * Visual timeline showing goal progress and milestones
 */

import React from 'react';
import { Calendar, Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGoalProgress } from '../../hooks/use-goals';
import { format } from 'date-fns';

interface GoalTimelineProps {
  goalId: string;
  goalName: string;
  targetDate: string;
  className?: string;
}

export default function GoalTimeline({
  goalId,
  goalName,
  targetDate,
  className,
}: GoalTimelineProps) {
  const { data: progress, isLoading } = useGoalProgress(goalId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Goal Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Goal Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No progress data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const targetDateObj = new Date(targetDate);
  const now = new Date();
  const startDate = new Date(targetDateObj);
  startDate.setFullYear(startDate.getFullYear() - (progress.monthsRemaining / 12 + 1));

  // Calculate milestones (25%, 50%, 75%, 100%)
  const milestones = [
    { label: '25%', value: 25, date: calculateMilestoneDate(startDate, targetDateObj, 0.25) },
    { label: '50%', value: 50, date: calculateMilestoneDate(startDate, targetDateObj, 0.5) },
    { label: '75%', value: 75, date: calculateMilestoneDate(startDate, targetDateObj, 0.75) },
    { label: '100%', value: 100, date: targetDateObj },
  ];

  function calculateMilestoneDate(start: Date, end: Date, percentage: number): Date {
    const diff = end.getTime() - start.getTime();
    return new Date(start.getTime() + diff * percentage);
  }

  const isMilestoneReached = (milestoneValue: number) => {
    return progress.progress >= milestoneValue;
  };

  const getMilestoneStatus = (milestoneValue: number) => {
    if (isMilestoneReached(milestoneValue)) {
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (progress.progress > milestoneValue - 10) {
      return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    return { icon: Target, color: 'text-gray-400', bg: 'bg-gray-100' };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Goal Timeline
        </CardTitle>
        <CardDescription>{goalName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-lg font-bold">{progress.progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress.progress} className="h-3" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current:</span>
              <p className="font-semibold">{formatCurrency(progress.currentAmount)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Target:</span>
              <p className="font-semibold">{formatCurrency(progress.targetAmount)}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Milestones</h4>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Milestones */}
            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const status = getMilestoneStatus(milestone.value);
                const StatusIcon = status.icon;
                const isReached = isMilestoneReached(milestone.value);

                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        isReached
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 bg-background'
                      }`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 ${
                          isReached ? 'text-green-600' : status.color
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {milestone.label} Milestone
                            {isReached && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Achieved
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(milestone.date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency((progress.targetAmount * milestone.value) / 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projected Completion */}
        {progress.projectedCompletion && (
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Projected Completion</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on current progress, this goal is projected to be completed by{' '}
              <span className="font-medium">
                {format(new Date(progress.projectedCompletion), 'MMM dd, yyyy')}
              </span>
            </p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {progress.monthsRemaining} months remaining
            </span>
          </div>
          <Badge variant={progress.onTrack ? 'default' : 'destructive'}>
            {progress.onTrack ? 'On Track' : 'Behind Schedule'}
          </Badge>
        </div>

        {/* Shortfall Warning */}
        {progress.shortfall && progress.shortfall > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Shortfall Detected</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              You need to invest an additional {formatCurrency(progress.shortfall)} to reach your
              target on time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
