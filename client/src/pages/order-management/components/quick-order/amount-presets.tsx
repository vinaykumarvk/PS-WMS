/**
 * Amount Presets Component
 * Module A: Quick Order Placement
 * Displays quick-select buttons for common investment amounts
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AMOUNT_PRESETS } from '../../types/quick-order.types';

interface AmountPresetsProps {
  selectedAmount?: number;
  onSelectAmount: (amount: number) => void;
  disabled?: boolean;
}

export default function AmountPresets({
  selectedAmount,
  onSelectAmount,
  disabled = false,
}: AmountPresetsProps) {
  const formatAmount = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(0)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Quick Amount</label>
      <div className="flex flex-wrap gap-2">
        {AMOUNT_PRESETS.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={selectedAmount === amount ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectAmount(amount)}
            disabled={disabled}
            className="min-w-[80px]"
          >
            {formatAmount(amount)}
          </Button>
        ))}
      </div>
    </div>
  );
}

