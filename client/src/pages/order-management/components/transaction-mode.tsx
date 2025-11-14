import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { TransactionMode as TransactionModeType, TransactionModeData } from '../types/order.types';
import { validateEUIN } from '../utils/order-validations';

interface TransactionModeProps {
  value: TransactionModeType | null;
  onChange: (mode: TransactionModeType, data?: Partial<TransactionModeData>) => void;
  modeData?: TransactionModeData;
  onDataChange?: (data: Partial<TransactionModeData>) => void;
  required?: boolean;
}

export default function TransactionMode({ 
  value, 
  onChange, 
  modeData,
  onDataChange,
  required = false 
}: TransactionModeProps) {
  const [euin, setEuin] = useState(modeData?.euin || '');
  const [euinError, setEuinError] = useState('');

  // Sync EUIN state with parent when modeData changes
  React.useEffect(() => {
    if (modeData?.euin !== undefined && modeData.euin !== euin) {
      setEuin(modeData.euin);
    }
  }, [modeData?.euin]);

  const handleModeChange = (mode: TransactionModeType) => {
    onChange(mode, { mode, ...modeData });
  };

  const handleEuinChange = (newEuin: string) => {
    const upperEuin = newEuin.toUpperCase();
    setEuin(upperEuin);
    const validation = validateEUIN(newEuin);
    if (!validation.isValid) {
      setEuinError(validation.errors[0] || '');
    } else {
      setEuinError('');
    }
    onDataChange?.({ euin: upperEuin });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <RadioGroup value={value || undefined} onValueChange={handleModeChange} aria-label="Transaction mode selection" aria-required={required}>
        <div className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation">
          <RadioGroupItem value="Physical" id="physical" aria-required={required} className="h-5 w-5" />
          <Label htmlFor="physical" className="cursor-pointer text-sm sm:text-base font-normal">Physical</Label>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation">
          <RadioGroupItem value="Email" id="email" aria-required={required} className="h-5 w-5" />
          <Label htmlFor="email" className="cursor-pointer text-sm sm:text-base font-normal">Email</Label>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation">
          <RadioGroupItem value="Telephone" id="telephone" aria-required={required} className="h-5 w-5" />
          <Label htmlFor="telephone" className="cursor-pointer text-sm sm:text-base font-normal">Telephone</Label>
        </div>
      </RadioGroup>

      {/* Mode-specific fields */}
      {value === 'Email' && (
        <div className="space-y-2">
          <Label htmlFor="email-address" className="text-sm sm:text-base">
            Email Address <span className="text-destructive" aria-label="required">*</span>
          </Label>
          <Input
            id="email-address"
            type="email"
            placeholder="Enter email address"
            value={modeData?.email || ''}
            onChange={(e) => onDataChange?.({ email: e.target.value })}
            aria-required="true"
            required
            className="min-h-[44px] text-base sm:text-sm"
            aria-invalid={modeData?.email ? 'false' : 'true'}
          />
        </div>
      )}

      {value === 'Telephone' && (
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-sm sm:text-base">
            Phone Number <span className="text-destructive" aria-label="required">*</span>
          </Label>
          <Input
            id="phone-number"
            type="tel"
            placeholder="Enter phone number"
            value={modeData?.phoneNumber || ''}
            onChange={(e) => onDataChange?.({ phoneNumber: e.target.value })}
            aria-required="true"
            required
            className="min-h-[44px] text-base sm:text-sm"
            aria-invalid={modeData?.phoneNumber ? 'false' : 'true'}
          />
        </div>
      )}

      {value === 'Physical' && (
        <div className="space-y-2">
          <Label htmlFor="physical-address" className="text-sm sm:text-base">
            Physical Address <span className="text-destructive" aria-label="required">*</span>
          </Label>
          <Input
            id="physical-address"
            type="text"
            placeholder="Enter physical address"
            value={modeData?.physicalAddress || ''}
            onChange={(e) => onDataChange?.({ physicalAddress: e.target.value })}
            aria-required="true"
            required
            className="min-h-[44px] text-base sm:text-sm"
            aria-invalid={modeData?.physicalAddress ? 'false' : 'true'}
          />
        </div>
      )}

      {/* EUIN Field (optional, shown for all modes) */}
      <div className="space-y-2">
        <Label htmlFor="euin" className="text-sm sm:text-base">EUIN (Optional)</Label>
        <Input
          id="euin"
          type="text"
          placeholder="E123456"
          value={euin}
          onChange={(e) => handleEuinChange(e.target.value)}
          maxLength={7}
          className={`min-h-[44px] text-base sm:text-sm ${euinError ? 'border-destructive' : ''}`}
          aria-invalid={euinError ? 'true' : 'false'}
          aria-describedby={euinError ? 'euin-error' : 'euin-help'}
        />
        {euinError && (
          <p id="euin-error" className="text-xs sm:text-sm text-destructive" role="alert">{euinError}</p>
        )}
        <p id="euin-help" className="text-xs text-muted-foreground">Format: E followed by 6 alphanumeric characters</p>
      </div>

      {required && !value && (
        <p className="text-sm text-destructive">Transaction mode is required</p>
      )}
    </div>
  );
}

