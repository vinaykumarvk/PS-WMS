/**
 * Portfolio Sidebar Component
 * Module B: Portfolio-Aware Ordering
 * Integrates all portfolio-aware features in a sidebar
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio, useImpactPreview, useAllocationGaps, useRebalancingSuggestions, useHoldings } from '../hooks/use-portfolio-analysis';
import PortfolioImpactPreview from './portfolio-aware/portfolio-impact-preview';
import AllocationGapAnalysis from './portfolio-aware/allocation-gap-analysis';
import RebalancingSuggestions from './portfolio-aware/rebalancing-suggestions';
import HoldingsIntegration from './portfolio-aware/holdings-integration';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Wallet } from 'lucide-react';
import type { CartItem } from '../types/order.types';
import type { TargetAllocation } from '@shared/types/portfolio.types';

interface PortfolioSidebarProps {
  clientId: number | null;
  cartItems?: CartItem[];
  targetAllocation?: TargetAllocation;
  className?: string;
}

const ALLOCATION_COLORS = {
  equity: '#0A3B80',
  debt: '#2A9D49',
  hybrid: '#FF8000',
  others: '#6B7280',
};

export default function PortfolioSidebar({
  clientId,
  cartItems = [],
  targetAllocation,
  className = '',
}: PortfolioSidebarProps) {
  const { data: portfolio, isLoading } = usePortfolio(clientId, false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!clientId) {
    return (
      <Card className={className}>
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Select a client to view portfolio insights</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card className={className}>
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Unable to load portfolio data</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const allocationData = [
    { name: 'Equity', value: portfolio.allocation.equity, color: ALLOCATION_COLORS.equity },
    { name: 'Debt', value: portfolio.allocation.debt, color: ALLOCATION_COLORS.debt },
    { name: 'Hybrid', value: portfolio.allocation.hybrid, color: ALLOCATION_COLORS.hybrid },
    { name: 'Others', value: portfolio.allocation.others, color: ALLOCATION_COLORS.others },
  ].filter((item) => item.value > 0);

  return (
    <Card className={className}>
      <div className="p-4">
        {/* Portfolio Summary */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Portfolio Overview</h3>
            <Badge variant="outline" className="gap-1">
              <Wallet className="h-3 w-3" />
              {portfolio.totalValue > 0 ? 'Active' : 'New'}
            </Badge>
          </div>

          {/* Portfolio Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Total Value</p>
              <p className="text-lg font-semibold">
                ₹{portfolio.totalValue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Gain/Loss</p>
              <div className="flex items-center gap-1">
                {portfolio.totalGainLoss >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                )}
                <p
                  className={`text-lg font-semibold ${
                    portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {portfolio.totalGainLoss >= 0 ? '+' : ''}
                  {portfolio.totalGainLossPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Allocation Chart */}
          {allocationData.length > 0 && (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">
              Impact
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              Gaps
            </TabsTrigger>
            <TabsTrigger value="holdings" className="text-xs">
              Holdings
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              <AllocationGapAnalysis clientId={clientId} targetAllocation={targetAllocation} />
              <RebalancingSuggestions
                clientId={clientId}
                targetAllocation={targetAllocation}
              />
            </TabsContent>

            <TabsContent value="impact" className="mt-0">
              <PortfolioImpactPreview clientId={clientId} order={cartItems} />
            </TabsContent>

            <TabsContent value="gaps" className="mt-0">
              <AllocationGapAnalysis clientId={clientId} targetAllocation={targetAllocation} />
            </TabsContent>

            <TabsContent value="holdings" className="mt-0">
              <HoldingsIntegration clientId={clientId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </Card>
  );
}

