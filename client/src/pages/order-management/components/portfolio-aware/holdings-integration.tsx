/**
 * Holdings Integration Component
 * Module B: Portfolio-Aware Ordering
 * Shows existing holdings when selecting schemes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useHoldings, usePortfolio } from '../../hooks/use-portfolio-analysis';

interface HoldingsIntegrationProps {
  clientId: number | null;
  selectedSchemeId?: number;
  onSelectHolding?: (holding: any) => void;
}

export default function HoldingsIntegration({
  clientId,
  selectedSchemeId,
  onSelectHolding,
}: HoldingsIntegrationProps) {
  const { data: holdings, isLoading: holdingsLoading } = useHoldings(clientId, selectedSchemeId);
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(clientId, false);

  if (!clientId) {
    return null;
  }

  const isLoading = holdingsLoading || portfolioLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>Loading your portfolio holdings...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>No holdings found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You don't have any holdings yet. Start investing to build your portfolio.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group holdings by category
  const holdingsByCategory = holdings.reduce(
    (acc, holding) => {
      const category = holding.category || 'others';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(holding);
      return acc;
    },
    {} as Record<string, typeof holdings>
  );

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              {holdings.length} scheme{holdings.length > 1 ? 's' : ''} in your portfolio
            </CardDescription>
          </div>
          {portfolio && (
            <Badge variant="secondary" className="text-sm">
              Total: ₹{portfolio.totalValue.toLocaleString('en-IN')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="debt">Debt</TabsTrigger>
            <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <HoldingsTable
              holdings={holdings}
              totalValue={totalValue}
              onSelectHolding={onSelectHolding}
            />
          </TabsContent>

          {(['equity', 'debt', 'hybrid', 'others'] as const).map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              <HoldingsTable
                holdings={holdingsByCategory[category] || []}
                totalValue={totalValue}
                onSelectHolding={onSelectHolding}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface HoldingsTableProps {
  holdings: any[];
  totalValue: number;
  onSelectHolding?: (holding: any) => void;
}

function HoldingsTable({ holdings, totalValue, onSelectHolding }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p className="text-sm">No holdings in this category</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Scheme Name</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead className="text-right">Invested</TableHead>
            <TableHead className="text-right">Current Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="text-right">Allocation</TableHead>
            {onSelectHolding && <TableHead className="w-[100px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => {
            const allocation = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
            const isGain = holding.gainLoss >= 0;

            return (
              <TableRow key={holding.id}>
                <TableCell className="font-medium">{holding.schemeName}</TableCell>
                <TableCell className="text-right">
                  {holding.units.toFixed(4)}
                </TableCell>
                <TableCell className="text-right">
                  ₹{holding.investedAmount.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  ₹{holding.currentValue.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isGain ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={isGain ? 'text-green-600' : 'text-red-600'}>
                      {isGain ? '+' : ''}
                      {holding.gainLossPercent.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{allocation.toFixed(1)}%</Badge>
                </TableCell>
                {onSelectHolding && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectHolding(holding)}
                    >
                      Select
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

