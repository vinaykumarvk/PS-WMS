/**
 * Multi-Scheme Switch Component
 * Module D: Advanced Switch Features
 * Allows switching from one scheme to multiple target schemes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Plus, X, AlertTriangle, Info } from 'lucide-react';
import { useMultiSchemeSwitch } from '../../hooks/use-switch';
import { Product } from '../../types/order.types';
import { Holding } from '../../../../shared/types/portfolio.types';

interface TargetAllocation {
  schemeId: number;
  amount: number;
  percentage?: number;
}

interface MultiSchemeSwitchProps {
  sourceHoldings: Holding[];
  targetProducts: Product[];
  clientId?: number;
  onSuccess?: () => void;
}

export default function MultiSchemeSwitch({
  sourceHoldings,
  targetProducts,
  clientId,
  onSuccess,
}: MultiSchemeSwitchProps) {
  const [sourceSchemeId, setSourceSchemeId] = useState<number | null>(null);
  const [allocationType, setAllocationType] = useState<'amount' | 'percentage'>('amount');
  const [targets, setTargets] = useState<TargetAllocation[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>('');

  const multiSwitchMutation = useMultiSchemeSwitch();

  const selectedSource = sourceHoldings.find(h => h.productId === sourceSchemeId);
  const maxAmount = selectedSource ? selectedSource.currentValue : 0;

  const availableProducts = targetProducts.filter(
    p => p.id !== sourceSchemeId && !targets.some(t => t.schemeId === p.id)
  );

  const totalAllocated = targets.reduce((sum, t) => sum + t.amount, 0);
  const remainingAmount = parseFloat(totalAmount) - totalAllocated;

  const handleAddTarget = () => {
    if (availableProducts.length === 0) return;
    
    setTargets([
      ...targets,
      {
        schemeId: availableProducts[0].id,
        amount: 0,
        percentage: allocationType === 'percentage' ? 0 : undefined,
      },
    ]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index: number, field: keyof TargetAllocation, value: any) => {
    const updated = [...targets];
    updated[index] = { ...updated[index], [field]: value };
    
    // If allocation type is percentage, calculate amount
    if (allocationType === 'percentage' && field === 'percentage' && totalAmount) {
      updated[index].amount = (parseFloat(totalAmount) * parseFloat(value)) / 100;
    }
    // If allocation type is amount, calculate percentage
    else if (allocationType === 'amount' && field === 'amount' && totalAmount) {
      updated[index].percentage = (parseFloat(value) / parseFloat(totalAmount)) * 100;
    }
    
    setTargets(updated);
  };

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
    
    // If percentage mode, recalculate amounts
    if (allocationType === 'percentage' && value) {
      const total = parseFloat(value);
      setTargets(targets.map(t => ({
        ...t,
        amount: total * (t.percentage || 0) / 100,
      })));
    }
  };

  const handleSwitch = async () => {
    if (!sourceSchemeId || targets.length === 0 || !totalAmount) {
      return;
    }

    if (totalAllocated > parseFloat(totalAmount)) {
      return;
    }

    try {
      const params = {
        sourceSchemeId,
        targets: targets.map(t => ({
          schemeId: t.schemeId,
          amount: t.amount,
          percentage: allocationType === 'percentage' ? t.percentage : undefined,
        })),
      };

      await multiSwitchMutation.mutateAsync(params);
      
      // Reset form
      setSourceSchemeId(null);
      setTargets([]);
      setTotalAmount('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const isValid = 
    sourceSchemeId &&
    targets.length > 0 &&
    totalAmount &&
    parseFloat(totalAmount) > 0 &&
    parseFloat(totalAmount) <= maxAmount &&
    totalAllocated <= parseFloat(totalAmount) &&
    targets.every(t => t.amount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Multi-Scheme Switch
        </CardTitle>
        <CardDescription>
          Switch from one scheme to multiple target schemes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Scheme Selection */}
        <div className="space-y-2">
          <Label htmlFor="multi-source-scheme">Source Scheme *</Label>
          <Select
            value={sourceSchemeId?.toString() || ''}
            onValueChange={(value) => {
              setSourceSchemeId(parseInt(value));
              setTargets([]);
              setTotalAmount('');
            }}
          >
            <SelectTrigger id="multi-source-scheme">
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
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="space-y-2">
          <Label htmlFor="total-amount">Total Switch Amount (₹) *</Label>
          <Input
            id="total-amount"
            type="number"
            min="0"
            max={maxAmount}
            step="100"
            value={totalAmount}
            onChange={(e) => handleTotalAmountChange(e.target.value)}
            placeholder={`Max: ₹${maxAmount.toLocaleString()}`}
          />
          {maxAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Available: ₹{maxAmount.toLocaleString()}
            </p>
          )}
        </div>

        {/* Allocation Type */}
        <div className="space-y-2">
          <Label>Allocation Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="allocationType"
                value="amount"
                checked={allocationType === 'amount'}
                onChange={(e) => setAllocationType(e.target.value as 'amount')}
                className="h-4 w-4"
              />
              <span className="text-sm">By Amount</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="allocationType"
                value="percentage"
                checked={allocationType === 'percentage'}
                onChange={(e) => setAllocationType(e.target.value as 'percentage')}
                className="h-4 w-4"
              />
              <span className="text-sm">By Percentage</span>
            </label>
          </div>
        </div>

        {/* Target Schemes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Target Schemes</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTarget}
              disabled={availableProducts.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Scheme
            </Button>
          </div>

          {targets.map((target, index) => {
            const selectedProduct = targetProducts.find(p => p.id === target.schemeId);
            
            return (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Target {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTarget(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select
                    value={target.schemeId.toString()}
                    onValueChange={(value) => handleTargetChange(index, 'schemeId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetProducts
                        .filter(p => p.id !== sourceSchemeId && (p.id === target.schemeId || !targets.some(t => t.schemeId === p.id)))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.schemeName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {allocationType === 'amount' ? (
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      max={remainingAmount + target.amount}
                      step="100"
                      value={target.amount || ''}
                      onChange={(e) => handleTargetChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount"
                    />
                    {target.percentage !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {target.percentage.toFixed(2)}% of total
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={target.percentage || ''}
                      onChange={(e) => handleTargetChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="Enter percentage"
                    />
                    {target.amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ₹{target.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {targets.length > 0 && totalAmount && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Allocated:</span>
              <span className="font-medium">₹{totalAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining:</span>
              <span className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : ''}`}>
                ₹{remainingAmount.toLocaleString()}
              </span>
            </div>
            {remainingAmount < 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Total allocation exceeds available amount
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can allocate the switch amount across multiple target schemes. The total allocation should not exceed the switch amount.
          </AlertDescription>
        </Alert>

        {/* Execute Button */}
        <Button
          onClick={handleSwitch}
          disabled={!isValid || multiSwitchMutation.isPending}
          className="w-full"
        >
          {multiSwitchMutation.isPending ? 'Processing...' : 'Execute Multi-Scheme Switch'}
        </Button>
      </CardContent>
    </Card>
  );
}

