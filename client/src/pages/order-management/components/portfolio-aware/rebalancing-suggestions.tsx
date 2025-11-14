/**
 * Rebalancing Suggestions Component
 * Module B: Portfolio-Aware Ordering
 * Shows suggested actions to rebalance portfolio
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, RefreshCw, Lightbulb } from 'lucide-react';
import { useRebalancingSuggestions } from '../../hooks/use-portfolio-analysis';
import type { TargetAllocation } from '@shared/types/portfolio.types';
import type { CartItem } from '../../types/order.types';

interface RebalancingSuggestionsProps {
  clientId: number | null;
  targetAllocation?: TargetAllocation;
  onApplySuggestion?: (suggestion: any) => void;
}

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ACTION_ICONS = {
  Buy: TrendingUp,
  Sell: TrendingDown,
  Switch: RefreshCw,
};

export default function RebalancingSuggestions({
  clientId,
  targetAllocation,
  onApplySuggestion,
}: RebalancingSuggestionsProps) {
  const { data: suggestions, isLoading, error } = useRebalancingSuggestions(
    clientId,
    targetAllocation
  );

  if (!clientId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Suggestions</CardTitle>
          <CardDescription>Analyzing rebalancing opportunities...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !suggestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Suggestions</CardTitle>
          <CardDescription>Unable to generate suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load suggestions'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Suggestions</CardTitle>
          <CardDescription>Your portfolio is well-balanced</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
            <Lightbulb className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              No rebalancing needed at this time. Your portfolio aligns with your target allocation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rebalancing Suggestions</CardTitle>
        <CardDescription>
          {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} to optimize your
          portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => {
          const ActionIcon = ACTION_ICONS[suggestion.action] || RefreshCw;
          const isBuy = suggestion.action === 'Buy';
          const isSwitch = suggestion.action === 'Switch';

          return (
            <div
              key={suggestion.id}
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <ActionIcon
                      className={`h-4 w-4 ${
                        isBuy ? 'text-green-600' : isSwitch ? 'text-blue-600' : 'text-red-600'
                      }`}
                    />
                    <Badge
                      variant="outline"
                      className={PRIORITY_COLORS[suggestion.priority]}
                    >
                      {suggestion.priority}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {suggestion.action}
                    </Badge>
                  </div>

                  {/* Action Details */}
                  <div className="space-y-1">
                    {isSwitch ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">{suggestion.fromScheme}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium">{suggestion.toScheme}</span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          {isBuy ? 'Invest in: ' : 'Redeem from: '}
                        </span>
                        <span className="font-medium">
                          {suggestion.fromScheme || suggestion.toScheme}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">
                        ₹{suggestion.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-muted-foreground">{suggestion.reason}</p>

                  {/* Expected Impact */}
                  {suggestion.expectedImpact && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Expected Impact:
                      </p>
                      <p className="text-xs text-muted-foreground">{suggestion.expectedImpact}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {onApplySuggestion && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplySuggestion(suggestion)}
                    className="shrink-0"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

