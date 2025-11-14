/**
 * Redemption Options Selector Component
 * Module E: Instant Redemption Features
 * Allows selection of redemption type and options
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RedemptionType } from '@shared/types/order-management.types';

interface RedemptionOptionsProps {
  selectedType: RedemptionType;
  onTypeChange: (type: RedemptionType) => void;
  availableAmount?: number;
  maxInstantAmount?: number;
  className?: string;
}

export default function RedemptionOptions({
  selectedType,
  onTypeChange,
  availableAmount,
  maxInstantAmount = 50000,
  className,
}: RedemptionOptionsProps) {
  const isInstantEligible = availableAmount !== undefined && availableAmount <= maxInstantAmount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Redemption Options</CardTitle>
        <CardDescription>Select the type of redemption you want to perform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedType} onValueChange={(value) => onTypeChange(value as RedemptionType)}>
          {/* Standard Redemption */}
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="Standard" id="standard" className="mt-1" />
            <div className="flex-1 space-y-1">
              <Label htmlFor="standard" className="cursor-pointer font-semibold">
                Standard Redemption
              </Label>
              <p className="text-sm text-muted-foreground">
                Regular redemption processed within 3-5 business days. Suitable for any amount.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">3-5 Days</Badge>
                <Badge variant="outline">Any Amount</Badge>
              </div>
            </div>
          </div>

          {/* Instant Redemption */}
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="Instant" id="instant" className="mt-1" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="instant" className="cursor-pointer font-semibold">
                  Instant Redemption
                </Label>
                {isInstantEligible && (
                  <Badge variant="default" className="bg-green-600">
                    Eligible
                  </Badge>
                )}
                {availableAmount !== undefined && !isInstantEligible && (
                  <Badge variant="secondary">Not Eligible</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Fast redemption processed within minutes. Available for amounts up to ₹{maxInstantAmount.toLocaleString('en-IN')}.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Instant</Badge>
                <Badge variant="outline">Up to ₹{maxInstantAmount.toLocaleString('en-IN')}</Badge>
              </div>
              {availableAmount !== undefined && !isInstantEligible && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your redemption amount (₹{availableAmount.toLocaleString('en-IN')}) exceeds the instant redemption limit.
                    Please use Standard Redemption instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Full Redemption */}
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="Full" id="full" className="mt-1" />
            <div className="flex-1 space-y-1">
              <Label htmlFor="full" className="cursor-pointer font-semibold">
                Full Redemption
              </Label>
              <p className="text-sm text-muted-foreground">
                Redeem all units in the scheme. Processed within 3-5 business days.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">3-5 Days</Badge>
                <Badge variant="outline">All Units</Badge>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Information Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {selectedType === 'Instant' && (
              <>
                Instant redemption is processed immediately and funds are credited to your bank account within minutes.
                This option is only available for amounts up to ₹{maxInstantAmount.toLocaleString('en-IN')}.
              </>
            )}
            {selectedType === 'Standard' && (
              <>
                Standard redemption is processed within 3-5 business days. The redemption amount will be credited to
                your registered bank account after processing.
              </>
            )}
            {selectedType === 'Full' && (
              <>
                Full redemption will redeem all your units in this scheme. The entire amount will be credited to your
                registered bank account within 3-5 business days.
              </>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

