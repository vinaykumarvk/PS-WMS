/**
 * Quick Redemption from Holdings Component
 * Module E: Instant Redemption Features
 * Allows quick redemption directly from holdings list
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHoldings } from '../../hooks/use-portfolio-analysis';
import { useExecuteInstantRedemption } from '../../hooks/use-redemption';
import { CartItem } from '../../types/order.types';
import type { Holding } from '@shared/types/order-management.types';
import { cn } from '@/lib/utils';

interface QuickRedemptionProps {
  clientId: number | null;
  onRedemptionAdded?: (cartItem: CartItem) => void;
  className?: string;
}

const INSTANT_REDEMPTION_LIMIT = 50000; // ₹50K

export default function QuickRedemption({
  clientId,
  onRedemptionAdded,
  className,
}: QuickRedemptionProps) {
  const { data: holdings, isLoading } = useHoldings(clientId);
  const executeMutation = useExecuteInstantRedemption();

  // Simple eligibility check based on amount limits (no API call needed upfront)
  const isEligibleForInstant = (holding: Holding): boolean => {
    const maxRedemption = Math.min(holding.currentValue, INSTANT_REDEMPTION_LIMIT);
    return maxRedemption >= 10000; // Minimum redemption amount
  };

  const handleQuickRedeem = async (holding: Holding, amount: number) => {
    if (amount > INSTANT_REDEMPTION_LIMIT) {
      return;
    }

    if (amount > holding.currentValue) {
      return;
    }

    try {
      const result = await executeMutation.mutateAsync({
        schemeId: holding.productId,
        amount,
      });
      onRedemptionAdded?.(result.cartItem);
      setSelectedHolding(null);
      setRedemptionAmount(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getQuickAmounts = (holding: Holding) => {
    const maxAmount = Math.min(holding.currentValue, INSTANT_REDEMPTION_LIMIT);
    const amounts = [10000, 25000, 50000].filter((amt) => amt <= maxAmount);
    if (maxAmount > 0 && !amounts.includes(maxAmount)) {
      amounts.push(maxAmount);
    }
    return amounts;
  };

  if (!clientId) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Please select a client to view holdings
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Quick Redemption</CardTitle>
          <CardDescription>Loading your holdings...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Quick Redemption</CardTitle>
          <CardDescription>No holdings available for redemption</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have any holdings available for redemption at the moment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const eligibleHoldings = holdings.filter(
    (h) => h.currentValue >= 10000 && isEligibleForInstant(h)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>Quick Redemption</CardTitle>
        </div>
        <CardDescription>
          Instantly redeem from your holdings (up to ₹{INSTANT_REDEMPTION_LIMIT.toLocaleString('en-IN')})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {eligibleHoldings.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No holdings are eligible for instant redemption. Holdings must have a value of at least ₹10,000
              and be within the instant redemption limit.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheme</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleHoldings.map((holding) => {
                  const quickAmounts = getQuickAmounts(holding);
                  const isEligible = isEligibleForInstant(holding);
                  const isProcessing = executeMutation.isPending;

                  return (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{holding.schemeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {holding.units.toFixed(4)} units
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          ₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            'font-medium',
                            holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {holding.gainLoss >= 0 ? '+' : ''}
                          ₹{holding.gainLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={cn(
                            'text-xs',
                            holding.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {holding.gainLossPercent >= 0 ? '+' : ''}
                          {holding.gainLossPercent.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1 items-end">
                          <div className="flex gap-1 flex-wrap justify-end">
                            {quickAmounts.slice(0, 3).map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickRedeem(holding, amount)}
                                disabled={isProcessing || !isEligible}
                                className="text-xs h-7"
                              >
                                ₹{(amount / 1000).toFixed(0)}K
                              </Button>
                            ))}
                          </div>
                          {isEligible && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              <Zap className="h-3 w-3 mr-1" />
                              Instant Eligible
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Quick redemption is available for amounts up to ₹{INSTANT_REDEMPTION_LIMIT.toLocaleString('en-IN')}.
                Select a quick amount to instantly redeem from your holdings.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

