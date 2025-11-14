/**
 * Portfolio Impact Preview Component
 * Module B: Portfolio-Aware Ordering
 * Shows how an order will affect portfolio allocation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useImpactPreview } from '../../hooks/use-portfolio-analysis';
import type { CartItem } from '../../types/order.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PortfolioImpactPreviewProps {
  clientId: number | null;
  order: CartItem[];
}

const ALLOCATION_COLORS = {
  equity: '#0A3B80',
  debt: '#2A9D49',
  hybrid: '#FF8000',
  others: '#6B7280',
};

export default function PortfolioImpactPreview({
  clientId,
  order,
}: PortfolioImpactPreviewProps) {
  const { data: impact, isLoading, error } = useImpactPreview(clientId, order);

  if (!clientId || !order || order.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Impact Preview</CardTitle>
          <CardDescription>Calculating impact of your order...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !impact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Impact Preview</CardTitle>
          <CardDescription>Unable to calculate impact</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load impact preview'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      category: 'Equity',
      before: impact.beforeAllocation.equity,
      after: impact.afterAllocation.equity,
    },
    {
      category: 'Debt',
      before: impact.beforeAllocation.debt,
      after: impact.afterAllocation.debt,
    },
    {
      category: 'Hybrid',
      before: impact.beforeAllocation.hybrid,
      after: impact.afterAllocation.hybrid,
    },
    {
      category: 'Others',
      before: impact.beforeAllocation.others,
      after: impact.afterAllocation.others,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Impact Preview</CardTitle>
        <CardDescription>
          How this order will affect your portfolio allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelFormatter={(label) => `${label} Allocation`}
              />
              <Legend />
              <Bar dataKey="before" fill="#94a3b8" name="Before" />
              <Bar dataKey="after" fill="#0A3B80" name="After" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Changes Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Allocation Changes</h4>
          <div className="grid grid-cols-2 gap-2">
            {impact.changes.map((change) => {
              const isIncrease = change.direction === 'increase';
              const isDecrease = change.direction === 'decrease';
              const isNeutral = Math.abs(change.change) < 0.1;

              return (
                <div
                  key={change.category}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{change.category}</span>
                    {isNeutral ? (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    ) : isIncrease ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {impact.beforeAllocation[change.category as keyof typeof impact.beforeAllocation].toFixed(1)}%
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span
                      className={`text-sm font-semibold ${
                        isIncrease
                          ? 'text-green-600'
                          : isDecrease
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {impact.afterAllocation[change.category as keyof typeof impact.afterAllocation].toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Value Change */}
        {impact.totalValueChange !== 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Portfolio Change</span>
              <Badge
                variant={impact.totalValueChange > 0 ? 'default' : 'secondary'}
                className={
                  impact.totalValueChange > 0
                    ? 'bg-green-600'
                    : impact.totalValueChange < 0
                    ? 'bg-red-600'
                    : ''
                }
              >
                {impact.totalValueChange > 0 ? '+' : ''}
                ₹{Math.abs(impact.totalValueChange).toLocaleString('en-IN')}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

