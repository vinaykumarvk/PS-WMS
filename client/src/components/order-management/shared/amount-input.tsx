/**
 * Foundation Layer - F4: Amount Input Component
 * Reusable amount input with validation and formatting
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@shared/utils/formatting';
import { validateAmountRange, validatePositiveAmount } from '@shared/utils/validation';
import { useState, useEffect } from 'react';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showPresets?: boolean;
  presets?: number[];
  className?: string;
  error?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function AmountInput({
  value,
  onChange,
  min,
  max,
  label = 'Amount',
  placeholder = 'Enter amount',
  required = false,
  showPresets = false,
  presets = [5000, 10000, 25000, 50000, 100000],
  className,
  error,
  onValidationChange,
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value > 0 ? value.toString() : '');
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    setDisplayValue(value > 0 ? value.toString() : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Allow empty input
    if (inputValue === '') {
      onChange(0);
      setLocalError('');
      onValidationChange?.(false);
      return;
    }

    const numValue = parseFloat(inputValue);
    
    if (isNaN(numValue)) {
      setLocalError('Please enter a valid number');
      onValidationChange?.(false);
      return;
    }

    // Validate positive
    const positiveValidation = validatePositiveAmount(numValue);
    if (!positiveValidation.isValid) {
      setLocalError(positiveValidation.errors[0]);
      onValidationChange?.(false);
      return;
    }

    // Validate range
    if (min !== undefined || max !== undefined) {
      const rangeValidation = validateAmountRange(numValue, min || 0, max);
      if (!rangeValidation.isValid) {
        setLocalError(rangeValidation.errors[0]);
        onValidationChange?.(false);
        return;
      }
    }

    setLocalError('');
    onChange(numValue);
    onValidationChange?.(true);
  };

  const handlePresetClick = (preset: number) => {
    setDisplayValue(preset.toString());
    onChange(preset);
    setLocalError('');
    onValidationChange?.(true);
  };

  const errorMessage = error || localError;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="amount-input" className="mb-2">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="space-y-2">
        <Input
          id="amount-input"
          type="number"
          step="0.01"
          min={min}
          max={max}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={errorMessage ? 'border-destructive' : ''}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'amount-error' : undefined}
        />
        {errorMessage && (
          <p id="amount-error" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        {min !== undefined && (
          <p className="text-xs text-muted-foreground">
            Min: {formatCurrency(min)} {max !== undefined && `| Max: ${formatCurrency(max)}`}
          </p>
        )}
        {showPresets && (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="px-3 py-1 text-xs border rounded-md hover:bg-muted transition-colors"
              >
                {formatCurrency(preset, { showSymbol: true })}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

