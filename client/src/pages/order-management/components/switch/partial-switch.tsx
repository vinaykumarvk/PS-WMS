/**
 * Partial Switch Component
 * Module D: Advanced Switch Features
 * Allows switching a specific amount/units from one scheme to another
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRightLeft, AlertTriangle, Info } from 'lucide-react';
import { usePartialSwitch, useSwitchCalculation } from '../../hooks/use-switch';
import { Product } from '../../types/order.types';
import { Holding } from '../../../../shared/types/portfolio.types';

interface PartialSwitchProps {
  sourceHoldings: Holding[];
  targetProducts: Product[];
  clientId?: number;
  onSuccess?: () => void;
}

export default function PartialSwitch({
  sourceHoldings,
  targetProducts,
  clientId,
  onSuccess,
}: PartialSwitchProps) {
  const [sourceSchemeId, setSourceSchemeId] = useState<number | null>(null);
  const [targetSchemeId, setTargetSchemeId] = useState<number | null>(null);
  const [switchType, setSwitchType] = useState<'amount' | 'units'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [units, setUnits] = useState<string>('');

  const partialSwitchMutation = usePartialSwitch();
  const calculateMutation = useSwitchCalculation();

  const selectedSource = sourceHoldings.find(h => h.productId === sourceSchemeId);
  const maxAmount = selectedSource ? selectedSource.currentValue : 0;
  const maxUnits = selectedSource ? selectedSource.units : 0;

  const handleSwitch = async () => {
    if (!sourceSchemeId || !targetSchemeId) {
      return;
    }

    if (switchType === 'amount' && (!amount || parseFloat(amount) <= 0)) {
      return;
    }

    if (switchType === 'units' && (!units || parseFloat(units) <= 0)) {
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

      await partialSwitchMutation.mutateAsync(params);
      
      // Reset form
      setSourceSchemeId(null);
      setTargetSchemeId(null);
      setAmount('');
      setUnits('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handlePreview = async () => {
    if (!sourceSchemeId || !targetSchemeId) {
      return;
    }

    if (switchType === 'amount' && (!amount || parseFloat(amount) <= 0)) {
      return;
    }

    if (switchType === 'units' && (!units || parseFloat(units) <= 0)) {
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

      await calculateMutation.mutateAsync(params);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Partial Switch
        </CardTitle>
        <CardDescription>
          Switch a specific amount or units from one scheme to another
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Scheme Selection */}
        <div className="space-y-2">
          <Label htmlFor="partial-source-scheme">Source Scheme *</Label>
          <Select
            value={sourceSchemeId?.toString() || ''}
            onValueChange={(value) => {
              setSourceSchemeId(parseInt(value));
              setAmount('');
              setUnits('');
            }}
          >
            <SelectTrigger id="partial-source-scheme">
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
              <p>Gain/Loss: 
                <span className={selectedSource.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}{selectedSource.gainLoss >= 0 ? '+' : ''}₹{selectedSource.gainLoss.toLocaleString()} 
                  ({selectedSource.gainLossPercent >= 0 ? '+' : ''}{selectedSource.gainLossPercent.toFixed(2)}%)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Target Scheme Selection */}
        <div className="space-y-2">
          <Label htmlFor="partial-target-scheme">Target Scheme *</Label>
          <Select
            value={targetSchemeId?.toString() || ''}
            onValueChange={(value) => setTargetSchemeId(parseInt(value))}
          >
            <SelectTrigger id="partial-target-scheme">
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
        </div>

        {/* Switch Type Selection */}
        <div className="space-y-2">
          <Label>Switch By</Label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="partialSwitchType"
                value="amount"
                checked={switchType === 'amount'}
                onChange={(e) => {
                  setSwitchType(e.target.value as 'amount');
                  setUnits('');
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">Amount</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="partialSwitchType"
                value="units"
                checked={switchType === 'units'}
                onChange={(e) => {
                  setSwitchType(e.target.value as 'units');
                  setAmount('');
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
            <Label htmlFor="partial-amount">Switch Amount (₹) *</Label>
            <Input
              id="partial-amount"
              type="number"
              min="0"
              max={maxAmount}
              step="100"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= maxAmount)) {
                  setAmount(value);
                }
              }}
              placeholder={`Max: ₹${maxAmount.toLocaleString()}`}
            />
            {maxAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: ₹{maxAmount.toLocaleString()}
              </p>
            )}
            {amount && parseFloat(amount) > maxAmount && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Amount exceeds available balance
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="partial-units">Switch Units *</Label>
            <Input
              id="partial-units"
              type="number"
              min="0"
              max={maxUnits}
              step="0.01"
              value={units}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= maxUnits)) {
                  setUnits(value);
                }
              }}
              placeholder={`Max: ${maxUnits.toLocaleString()}`}
            />
            {maxUnits > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: {maxUnits.toLocaleString()} units
              </p>
            )}
            {units && parseFloat(units) > maxUnits && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Units exceed available balance
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Partial switch allows you to move a portion of your investment while keeping the rest in the source scheme.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={
              !sourceSchemeId ||
              !targetSchemeId ||
              calculateMutation.isPending ||
              (switchType === 'amount' && (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount)) ||
              (switchType === 'units' && (!units || parseFloat(units) <= 0 || parseFloat(units) > maxUnits))
            }
            className="flex-1"
          >
            Preview Calculation
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={
              !sourceSchemeId ||
              !targetSchemeId ||
              partialSwitchMutation.isPending ||
              (switchType === 'amount' && (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount)) ||
              (switchType === 'units' && (!units || parseFloat(units) <= 0 || parseFloat(units) > maxUnits))
            }
            className="flex-1"
          >
            {partialSwitchMutation.isPending ? 'Processing...' : 'Execute Switch'}
          </Button>
        </div>

        {/* Calculation Preview */}
        {calculateMutation.data && (
          <div className="pt-4 border-t space-y-2">
            <h5 className="font-semibold text-sm">Preview</h5>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Net Amount: <span className="font-medium">₹{calculateMutation.data.netAmount.toLocaleString()}</span>
              </p>
              {calculateMutation.data.exitLoadAmount && calculateMutation.data.exitLoadAmount > 0 && (
                <p className="text-muted-foreground">
                  Exit Load: <span className="font-medium">₹{calculateMutation.data.exitLoadAmount.toLocaleString()}</span>
                </p>
              )}
              {calculateMutation.data.taxImplications?.taxAmount && (
                <p className="text-muted-foreground">
                  Estimated Tax: <span className="font-medium">₹{calculateMutation.data.taxImplications.taxAmount.toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

