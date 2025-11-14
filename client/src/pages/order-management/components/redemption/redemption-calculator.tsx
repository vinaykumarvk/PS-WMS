/**
 * Redemption Calculator Component
 * Module E: Instant Redemption Features
 * Calculates redemption amounts with exit load and TDS
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalculateRedemption } from '../../hooks/use-redemption';
import type { RedemptionCalculation } from '@shared/types/order-management.types';
import { cn } from '@/lib/utils';

interface RedemptionCalculatorProps {
  schemeId: number;
  schemeName: string;
  currentNav: number;
  availableUnits?: number;
  onCalculate?: (calculation: RedemptionCalculation) => void;
  className?: string;
}

export default function RedemptionCalculator({
  schemeId,
  schemeName,
  currentNav,
  availableUnits,
  onCalculate,
  className,
}: RedemptionCalculatorProps) {
  const [inputType, setInputType] = useState<'units' | 'amount'>('amount');
  const [units, setUnits] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [redemptionType, setRedemptionType] = useState<'Standard' | 'Instant' | 'Full'>('Standard');
  const [calculation, setCalculation] = useState<RedemptionCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateMutation = useCalculateRedemption();

  // Calculate units from amount or vice versa
  useEffect(() => {
    if (inputType === 'amount' && amount && currentNav > 0) {
      const calculatedUnits = parseFloat(amount) / currentNav;
      if (!isNaN(calculatedUnits)) {
        setUnits(calculatedUnits.toFixed(4));
      }
    } else if (inputType === 'units' && units && currentNav > 0) {
      const calculatedAmount = parseFloat(units) * currentNav;
      if (!isNaN(calculatedAmount)) {
        setAmount(calculatedAmount.toFixed(2));
      }
    }
  }, [inputType, amount, units, currentNav]);

  // Validate inputs
  const validateInputs = (): boolean => {
    setError(null);

    if (inputType === 'units') {
      const unitsValue = parseFloat(units);
      if (isNaN(unitsValue) || unitsValue <= 0) {
        setError('Please enter a valid number of units');
        return false;
      }
      if (availableUnits && unitsValue > availableUnits) {
        setError(`You can only redeem up to ${availableUnits.toFixed(4)} units`);
        return false;
      }
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid redemption amount');
        return false;
      }
      if (availableUnits) {
        const maxAmount = availableUnits * currentNav;
        if (amountValue > maxAmount) {
          setError(`Maximum redemption amount is ₹${maxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const params: any = {
        schemeId,
        redemptionType,
      };

      if (inputType === 'units') {
        params.units = parseFloat(units);
      } else {
        params.amount = parseFloat(amount);
      }

      const result = await calculateMutation.mutateAsync(params);
      setCalculation(result);
      onCalculate?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate redemption');
    }
  };

  const handleReset = () => {
    setUnits('');
    setAmount('');
    setCalculation(null);
    setError(null);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Redemption Calculator</CardTitle>
        </div>
        <CardDescription>{schemeName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Type Selection */}
        <div className="space-y-3">
          <Label>Input Type</Label>
          <RadioGroup
            value={inputType}
            onValueChange={(value) => {
              setInputType(value as 'units' | 'amount');
              setUnits('');
              setAmount('');
              setCalculation(null);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="amount" id="amount" />
              <Label htmlFor="amount" className="cursor-pointer font-normal">
                Amount (₹)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="units" id="units" />
              <Label htmlFor="units" className="cursor-pointer font-normal">
                Units
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Redemption Type Selection */}
        <div className="space-y-3">
          <Label>Redemption Type</Label>
          <RadioGroup
            value={redemptionType}
            onValueChange={(value) => {
              setRedemptionType(value as 'Standard' | 'Instant' | 'Full');
              setCalculation(null);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Standard" id="standard" />
              <Label htmlFor="standard" className="cursor-pointer font-normal">
                Standard
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Instant" id="instant" />
              <Label htmlFor="instant" className="cursor-pointer font-normal">
                Instant
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Full" id="full" />
              <Label htmlFor="full" className="cursor-pointer font-normal">
                Full
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          {inputType === 'amount' ? (
            <div className="space-y-2">
              <Label htmlFor="amount-input">
                Redemption Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount-input"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setCalculation(null);
                }}
                min="0"
                step="0.01"
              />
              {availableUnits && (
                <p className="text-xs text-muted-foreground">
                  Available: {availableUnits.toFixed(4)} units (₹
                  {(availableUnits * currentNav).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="units-input">
                Units <span className="text-destructive">*</span>
              </Label>
              <Input
                id="units-input"
                type="number"
                placeholder="Enter units"
                value={units}
                onChange={(e) => {
                  setUnits(e.target.value);
                  setCalculation(null);
                }}
                min="0"
                step="0.0001"
              />
              {availableUnits && (
                <p className="text-xs text-muted-foreground">
                  Available: {availableUnits.toFixed(4)} units
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCalculate}
            disabled={calculateMutation.isPending || (!units && !amount)}
            className="flex-1"
          >
            {calculateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate'
            )}
          </Button>
          {calculation && (
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Calculation Results */}
        {calculateMutation.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {calculation && !calculateMutation.isPending && (
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold">Calculation Results</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Units:</span>
                <span className="font-medium">{calculation.units.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NAV:</span>
                <span className="font-medium">₹{calculation.nav.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount:</span>
                <span className="font-medium">₹{calculation.grossAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              {calculation.exitLoad && calculation.exitLoadAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exit Load ({calculation.exitLoad}%):</span>
                    <span className="font-medium text-destructive">
                      -₹{calculation.exitLoadAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Net Amount:</span>
                <span className="font-medium">₹{calculation.netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              {calculation.tds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TDS:</span>
                  <span className="font-medium text-destructive">
                    -₹{calculation.tds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Final Amount:</span>
                <span className="text-primary">
                  ₹{calculation.finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Settlement Date:</span>
                <span>{new Date(calculation.settlementDate).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

