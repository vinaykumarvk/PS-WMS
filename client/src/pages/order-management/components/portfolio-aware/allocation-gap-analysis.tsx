/**
 * Allocation Gap Analysis Component
 * Module B: Portfolio-Aware Ordering
 * Shows gaps between current and target allocation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAllocationGaps } from '../../hooks/use-portfolio-analysis';
import type { TargetAllocation } from '@shared/types/portfolio.types';

interface AllocationGapAnalysisProps {
  clientId: number | null;
  targetAllocation?: TargetAllocation;
}

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const CATEGORY_COLORS = {
  equity: '#0A3B80',
  debt: '#2A9D49',
  hybrid: '#FF8000',
  others: '#6B7280',
};

export default function AllocationGapAnalysis({
  clientId,
  targetAllocation,
}: AllocationGapAnalysisProps) {
  const { data: gaps, isLoading, error } = useAllocationGaps(clientId, targetAllocation);

  if (!clientId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation Gap Analysis</CardTitle>
          <CardDescription>Analyzing your portfolio allocation...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !gaps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation Gap Analysis</CardTitle>
          <CardDescription>Unable to analyze allocation gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load gap analysis'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const significantGaps = gaps.filter((gap) => Math.abs(gap.gap) > 1);
  const hasGaps = significantGaps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Gap Analysis</CardTitle>
        <CardDescription>
          {hasGaps
            ? 'Your portfolio allocation differs from target'
            : 'Your portfolio is well-balanced'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasGaps ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Your portfolio allocation aligns well with your target allocation.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                {significantGaps.length} allocation gap{significantGaps.length > 1 ? 's' : ''}{' '}
                identified
              </p>
            </div>

            {/* Gap Details */}
            <div className="space-y-3">
              {gaps.map((gap) => {
                const gapAbs = Math.abs(gap.gap);
                if (gapAbs < 1) return null; // Skip minor gaps

                const isOverAllocated = gap.gap < 0;
                const gapPercent = Math.abs(gap.gap);
                const progressValue = gap.target > 0 ? (gap.current / gap.target) * 100 : 0;

                return (
                  <div
                    key={gap.category}
                    className="p-3 rounded-lg border"
                    style={{
                      borderLeftColor: CATEGORY_COLORS[gap.category as keyof typeof CATEGORY_COLORS],
                      borderLeftWidth: '4px',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{gap.category}</span>
                          <Badge
                            variant="outline"
                            className={PRIORITY_COLORS[gap.priority]}
                          >
                            {gap.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {gap.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Current: {gap.current.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">
                          Target: {gap.target.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={gap.current}
                        max={Math.max(gap.current, gap.target) * 1.2}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Gap</span>
                        <span
                          className={
                            isOverAllocated
                              ? 'text-red-600 font-semibold'
                              : 'text-green-600 font-semibold'
                          }
                        >
                          {isOverAllocated ? '-' : '+'}
                          {gapPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-800">
                Consider rebalancing your portfolio to align with your target allocation and risk
                profile.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

