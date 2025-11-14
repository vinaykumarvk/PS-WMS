/**
 * Redemption Dialog Component
 * Module E: Instant Redemption Features
 * Main dialog wrapper for redemption features
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstantRedemption from './redemption/instant-redemption';
import RedemptionCalculator from './redemption/redemption-calculator';
import RedemptionOptions from './redemption/redemption-options';
import QuickRedemption from './redemption/quick-redemption';
import RedemptionHistory from './redemption/redemption-history';
import { CartItem } from '../types/order.types';
import type { RedemptionType, RedemptionCalculation } from '@shared/types/order-management.types';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '../types/order.types';
import { useHoldings } from '../hooks/use-portfolio-analysis';

interface RedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: CartItem) => void;
  clientId?: number | null;
  schemeId?: number;
  schemeName?: string;
}

export default function RedemptionDialog({
  open,
  onOpenChange,
  onAddToCart,
  clientId,
  schemeId,
  schemeName,
}: RedemptionDialogProps) {
  const [redemptionType, setRedemptionType] = useState<RedemptionType>('Standard');
  const [calculation, setCalculation] = useState<RedemptionCalculation | null>(null);

  // Fetch product details if schemeId is provided
  const { data: product } = useQuery<Product | null>({
    queryKey: ['/api/order-management/schemes', schemeId],
    queryFn: async () => {
      if (!schemeId) return null;
      const response = await apiRequest('GET', `/api/order-management/schemes/${schemeId}`);
      const data = await response.json();
      return data;
    },
    enabled: !!schemeId && open,
  });

  // Fetch holdings for the scheme if available
  const { data: holdings } = useHoldings(clientId, schemeId);
  const holding = holdings?.find((h) => h.productId === schemeId);
  const availableAmount = holding?.currentValue || 0;
  const availableUnits = holding?.units || 0;

  const handleRedemptionAdded = (cartItem: CartItem) => {
    onAddToCart(cartItem);
    onOpenChange(false);
  };

  const handleCalculate = (calc: RedemptionCalculation) => {
    setCalculation(calc);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Redemption</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {schemeName || 'Select a scheme to redeem'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="instant" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instant">Instant</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="quick">Quick</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Instant Redemption Tab */}
          <TabsContent value="instant" className="space-y-4 mt-4">
            {schemeId && product ? (
              <InstantRedemption
                schemeId={schemeId}
                schemeName={schemeName || product.schemeName}
                availableAmount={availableAmount}
                onRedemptionAdded={handleRedemptionAdded}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a scheme to perform instant redemption
              </div>
            )}
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4 mt-4">
            {schemeId && product ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RedemptionOptions
                  selectedType={redemptionType}
                  onTypeChange={setRedemptionType}
                  availableAmount={availableAmount}
                />
                <RedemptionCalculator
                  schemeId={schemeId}
                  schemeName={schemeName || product.schemeName}
                  currentNav={product.nav || 0}
                  availableUnits={availableUnits}
                  onCalculate={handleCalculate}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a scheme to calculate redemption
              </div>
            )}
          </TabsContent>

          {/* Quick Redemption Tab */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            <QuickRedemption
              clientId={clientId}
              onRedemptionAdded={handleRedemptionAdded}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <RedemptionHistory clientId={clientId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

