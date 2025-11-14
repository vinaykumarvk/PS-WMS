/**
 * Switch Dialog Component
 * Module D: Advanced Switch Features
 * Main dialog for switch operations with tabs for different switch types
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
import { ArrowRightLeft } from 'lucide-react';
import SwitchCalculator from './switch/switch-calculator';
import PartialSwitch from './switch/partial-switch';
import MultiSchemeSwitch from './switch/multi-scheme-switch';
import SwitchHistory from './switch/switch-history';
import SwitchRecommendations from './switch/switch-recommendations';
import { Product } from '../types/order.types';
import { Holding } from '../../../../shared/types/portfolio.types';
import { SwitchCalculation } from '../../../../shared/types/order-management.types';

interface SwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceHoldings: Holding[];
  targetProducts: Product[];
  clientId?: number;
  defaultTab?: 'calculator' | 'partial' | 'multi' | 'history' | 'recommendations';
}

export default function SwitchDialog({
  open,
  onOpenChange,
  sourceHoldings,
  targetProducts,
  clientId,
  defaultTab = 'calculator',
}: SwitchDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [calculation, setCalculation] = useState<SwitchCalculation | null>(null);

  const handleSuccess = () => {
    // Refresh data or show success message
    // The individual components handle their own success notifications
  };

  const handleRecommendationApply = () => {
    // Switch to calculator tab when recommendation is applied
    setActiveTab('calculator');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Switch Transactions
          </DialogTitle>
          <DialogDescription>
            Calculate, execute, and manage switch transactions between schemes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="multi">Multi-Scheme</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-4">
            <SwitchCalculator
              sourceHoldings={sourceHoldings}
              targetProducts={targetProducts}
              clientId={clientId}
              onCalculate={setCalculation}
            />
          </TabsContent>

          <TabsContent value="partial" className="mt-4">
            <PartialSwitch
              sourceHoldings={sourceHoldings}
              targetProducts={targetProducts}
              clientId={clientId}
              onSuccess={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="multi" className="mt-4">
            <MultiSchemeSwitch
              sourceHoldings={sourceHoldings}
              targetProducts={targetProducts}
              clientId={clientId}
              onSuccess={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {clientId ? (
              <SwitchHistory clientId={clientId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Client ID is required to view switch history
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            {clientId ? (
              <SwitchRecommendations
                clientId={clientId}
                onApplyRecommendation={handleRecommendationApply}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Client ID is required to view recommendations
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

