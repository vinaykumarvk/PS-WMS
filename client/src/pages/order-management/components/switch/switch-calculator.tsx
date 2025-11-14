/**
 * Switch Calculator Component
 * Module D: Advanced Switch Features
 * Calculates tax implications and costs for switch transactions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useSwitchCalculation } from '../../hooks/use-switch';
import { Product } from '../../types/order.types';
import { Holding } from '../../../../shared/types/portfolio.types';
import { SwitchCalculation } from '../../../../shared/types/order-management.types';

interface SwitchCalculatorProps {
  sourceHoldings: Holding[];
  targetProducts: Product[];
  clientId?: number;
  onCalculate?: (calculation: SwitchCalculation) => void;
}

export default function SwitchCalculator({
  sourceHoldings,
  targetProducts,
  clientId,
  onCalculate,
}: SwitchCalculatorProps) {
  const [sourceSchemeId, setSourceSchemeId] = useState<number | null>(null);
  const [targetSchemeId, setTargetSchemeId] = useState<number | null>(null);
  const [switchType, setSwitchType] = useState<'amount' | 'units'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [units, setUnits] = useState<string>('');
  const [calculation, setCalculation] = useState<SwitchCalculation | null>(null);

  const calculateMutation = useSwitchCalculation();

  const selectedSource = sourceHoldings.find(h => h.productId === sourceSchemeId);
  const selectedTarget = targetProducts.find(p => p.id === targetSchemeId);

  useEffect(() => {
    if (calculation && onCalculate) {
      onCalculate(calculation);
    }
  }, [calculation, onCalculate]);

  const handleCalculate = async () => {
    if (!sourceSchemeId || !targetSchemeId) {
      return;
    }

    if (switchType === 'amount' && !amount) {
      return;
    }

    if (switchType === 'units' && !units) {
      return;
    }

    try {
      const params: any = {
        sourceSchemeId,
        targetSchemeId,
      };

      if (switchType === 'amount') {
        params.amount = parseFloat(amount);
      } else {
        params.units = parseFloat(units);
      }

      const result = await calculateMutation.mutateAsync(params);
      setCalculation(result);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const maxAmount = selectedSource ? selectedSource.currentValue : 0;
  const maxUnits = selectedSource ? selectedSource.units : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Switch Calculator
        </CardTitle>
        <CardDescription>
          Calculate tax implications and costs before switching schemes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Scheme Selection */}
        <div className="space-y-2">
          <Label htmlFor="source-scheme">Source Scheme *</Label>
          <Select
            value={sourceSchemeId?.toString() || ''}
            onValueChange={(value) => {
              setSourceSchemeId(parseInt(value));
              setCalculation(null);
            }}
          >
            <SelectTrigger id="source-scheme">
              <SelectValue placeholder="Select source scheme" />
            </SelectTrigger>
            <SelectContent>
              {sourceHoldings.map((holding) => (
                <SelectItem key={holding.productId} value={holding.productId.toString()}>
                  {holding.schemeName} - ₹{holding.currentValue.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSource && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Current Value: ₹{selectedSource.currentValue.toLocaleString()}</p>
              <p>Units: {selectedSource.units.toLocaleString()}</p>
              <p>NAV: ₹{selectedSource.nav.toFixed(4)}</p>
            </div>
          )}
        </div>

        {/* Target Scheme Selection */}
        <div className="space-y-2">
          <Label htmlFor="target-scheme">Target Scheme *</Label>
          <Select
            value={targetSchemeId?.toString() || ''}
            onValueChange={(value) => {
              setTargetSchemeId(parseInt(value));
              setCalculation(null);
            }}
          >
            <SelectTrigger id="target-scheme">
              <SelectValue placeholder="Select target scheme" />
            </SelectTrigger>
            <SelectContent>
              {targetProducts
                .filter(p => p.id !== sourceSchemeId)
                .map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.schemeName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedTarget && (
            <div className="text-sm text-muted-foreground">
              <p>NAV: ₹{selectedTarget.nav?.toFixed(4) || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Switch Type Selection */}
        <div className="space-y-2">
          <Label>Switch By</Label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="switchType"
                value="amount"
                checked={switchType === 'amount'}
                onChange={(e) => {
                  setSwitchType(e.target.value as 'amount');
                  setCalculation(null);
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">Amount</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="switchType"
                value="units"
                checked={switchType === 'units'}
                onChange={(e) => {
                  setSwitchType(e.target.value as 'units');
                  setCalculation(null);
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">Units</span>
            </label>
          </div>
        </div>

        {/* Amount/Units Input */}
        {switchType === 'amount' ? (
          <div className="space-y-2">
            <Label htmlFor="amount">Switch Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              max={maxAmount}
              step="100"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setCalculation(null);
              }}
              placeholder={`Max: ₹${maxAmount.toLocaleString()}`}
            />
            {maxAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: ₹{maxAmount.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="units">Switch Units *</Label>
            <Input
              id="units"
              type="number"
              min="0"
              max={maxUnits}
              step="0.01"
              value={units}
              onChange={(e) => {
                setUnits(e.target.value);
                setCalculation(null);
              }}
              placeholder={`Max: ${maxUnits.toLocaleString()}`}
            />
            {maxUnits > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: {maxUnits.toLocaleString()} units
              </p>
            )}
          </div>
        )}

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={
            !sourceSchemeId ||
            !targetSchemeId ||
            calculateMutation.isPending ||
            (switchType === 'amount' && (!amount || parseFloat(amount) <= 0)) ||
            (switchType === 'units' && (!units || parseFloat(units) <= 0))
          }
          className="w-full"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Switch'}
        </Button>

        {/* Calculation Results */}
        {calculateMutation.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {calculation && !calculateMutation.isPending && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-lg">Calculation Results</h4>

            {/* Basic Switch Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Source Scheme</p>
                <p className="font-medium">{calculation.sourceScheme}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Target Scheme</p>
                <p className="font-medium">{calculation.targetScheme}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Source Units</p>
                <p className="font-medium">{calculation.sourceUnits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Target Units</p>
                <p className="font-medium">{calculation.targetUnits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Switch Amount</p>
                <p className="font-medium">₹{calculation.switchAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Amount</p>
                <p className="font-medium">₹{calculation.netAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Exit Load */}
            {calculation.exitLoadAmount && calculation.exitLoadAmount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Exit Load: {calculation.exitLoad}% = ₹{calculation.exitLoadAmount.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            {/* Tax Implications */}
            {calculation.taxImplications && (
              <div className="space-y-2 pt-2 border-t">
                <h5 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Tax Implications
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {calculation.taxImplications.shortTermGain !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Short-term Capital Gain</p>
                      <p className="font-medium">
                        {calculation.taxImplications.shortTermGain >= 0 ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            ₹{calculation.taxImplications.shortTermGain.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            ₹{Math.abs(calculation.taxImplications.shortTermGain).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {calculation.taxImplications.longTermGain !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Long-term Capital Gain</p>
                      <p className="font-medium">
                        {calculation.taxImplications.longTermGain >= 0 ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            ₹{calculation.taxImplications.longTermGain.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            ₹{Math.abs(calculation.taxImplications.longTermGain).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {calculation.taxImplications.taxAmount !== undefined && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Estimated Tax Amount</p>
                      <p className="font-medium text-lg">
                        ₹{calculation.taxImplications.taxAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Final Amount After Switch</span>
                <span className="text-lg font-bold">
                  ₹{calculation.netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

