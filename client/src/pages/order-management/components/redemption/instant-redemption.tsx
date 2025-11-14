/**
 * Instant Redemption Component
 * Module E: Instant Redemption Features
 * Handles instant redemption flow for amounts up to ₹50K
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCheckInstantRedemptionEligibility, useExecuteInstantRedemption } from '../../hooks/use-redemption';
import { CartItem } from '../../types/order.types';
import { cn } from '@/lib/utils';

interface InstantRedemptionProps {
  schemeId: number;
  schemeName: string;
  availableAmount: number;
  maxInstantAmount?: number;
  onRedemptionAdded?: (cartItem: CartItem) => void;
  className?: string;
}

const INSTANT_REDEMPTION_LIMIT = 50000; // ₹50K

export default function InstantRedemption({
  schemeId,
  schemeName,
  availableAmount,
  maxInstantAmount = INSTANT_REDEMPTION_LIMIT,
  onRedemptionAdded,
  className,
}: InstantRedemptionProps) {
  const [amount, setAmount] = useState<string>('');
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason?: string } | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  const checkEligibilityMutation = useCheckInstantRedemptionEligibility();
  const executeMutation = useExecuteInstantRedemption();

  // Check eligibility when amount changes
  useEffect(() => {
    const amountValue = parseFloat(amount);
    if (amount && !isNaN(amountValue) && amountValue > 0) {
      const timer = setTimeout(() => {
        checkEligibility(amountValue);
      }, 500); // Debounce

      return () => clearTimeout(timer);
    } else {
      setEligibility(null);
    }
  }, [amount]);

  const checkEligibility = async (amountValue: number) => {
    if (amountValue > maxInstantAmount) {
      setEligibility({
        eligible: false,
        reason: `Amount exceeds instant redemption limit of ₹${maxInstantAmount.toLocaleString('en-IN')}`,
      });
      return;
    }

    if (amountValue > availableAmount) {
      setEligibility({
        eligible: false,
        reason: `Amount exceeds available redemption amount of ₹${availableAmount.toLocaleString('en-IN')}`,
      });
      return;
    }

    setIsCheckingEligibility(true);
    try {
      const result = await checkEligibilityMutation.mutateAsync({
        schemeId,
        amount: amountValue,
      });
      setEligibility({
        eligible: result.eligible,
        reason: result.reason,
      });
    } catch (error: any) {
      setEligibility({
        eligible: false,
        reason: error.message || 'Failed to check eligibility',
      });
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleQuickAmount = (presetAmount: number) => {
    const amountToSet = Math.min(presetAmount, availableAmount, maxInstantAmount);
    setAmount(amountToSet.toString());
  };

  const handleExecute = async () => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    if (!eligibility?.eligible) {
      return;
    }

    try {
      const result = await executeMutation.mutateAsync({
        schemeId,
        amount: amountValue,
      });
      onRedemptionAdded?.(result.cartItem);
      setAmount('');
      setEligibility(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const canExecute = eligibility?.eligible && amount && parseFloat(amount) > 0;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>Instant Redemption</CardTitle>
        </div>
        <CardDescription>
          Fast redemption processed within minutes. Available for amounts up to ₹{maxInstantAmount.toLocaleString('en-IN')}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scheme Info */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scheme:</span>
              <span className="text-sm">{schemeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Amount:</span>
              <span className="text-sm">₹{availableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Instant Limit:</span>
              <span className="text-sm">₹{maxInstantAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Quick Amount Presets */}
        <div className="space-y-2">
          <Label>Quick Amount</Label>
          <div className="flex flex-wrap gap-2">
            {[10000, 25000, 50000].map((preset) => {
              const isDisabled = preset > availableAmount || preset > maxInstantAmount;
              return (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(preset)}
                  disabled={isDisabled}
                  className="text-xs"
                >
                  ₹{(preset / 1000).toFixed(0)}K
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(Math.min(availableAmount, maxInstantAmount))}
              className="text-xs"
            >
              Max
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="instant-amount">
            Redemption Amount (₹) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="instant-amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={Math.min(availableAmount, maxInstantAmount)}
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            Maximum: ₹{Math.min(availableAmount, maxInstantAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Eligibility Check */}
        {isCheckingEligibility && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking eligibility...</span>
          </div>
        )}

        {eligibility && !isCheckingEligibility && (
          <Alert variant={eligibility.eligible ? 'default' : 'destructive'}>
            {eligibility.eligible ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Eligible for Instant Redemption</div>
                  <div className="text-xs mt-1">
                    Your redemption will be processed immediately and funds will be credited within minutes.
                  </div>
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Not Eligible for Instant Redemption</div>
                  <div className="text-xs mt-1">{eligibility.reason}</div>
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!canExecute || executeMutation.isPending}
          className="w-full"
          size="lg"
        >
          {executeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Redeem Instantly
            </>
          )}
        </Button>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Instant redemption is available for amounts up to ₹{maxInstantAmount.toLocaleString('en-IN')}.
            Funds will be credited to your registered bank account within minutes after processing.
            For larger amounts, please use Standard Redemption.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

