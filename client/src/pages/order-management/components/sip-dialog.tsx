/**
 * SIP Dialog Component
 * Module C: SIP Builder & Manager
 * Main dialog for SIP operations with tabs for different SIP features
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
import { Calendar, Calculator, TrendingUp, List } from 'lucide-react';
import SIPBuilderWizard from './sip/sip-builder-wizard';
import SIPCalculator from './sip/sip-calculator';
import SIPCalendar from './sip/sip-calendar';
import SystematicPlansList from './systematic-plans-list';
import SIPPerformance from './sip/sip-performance';
import { Product } from '../types/order.types';
import { SIPBuilderInput } from '../../../../shared/types/sip.types';

interface SIPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  clientId?: number;
  defaultTab?: 'builder' | 'calculator' | 'calendar' | 'management' | 'performance';
  onSIPCreated?: (plan: any) => void;
}

export default function SIPDialog({
  open,
  onOpenChange,
  products,
  clientId,
  defaultTab = 'builder',
  onSIPCreated,
}: SIPDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  const handleSIPSubmit = async (data: SIPBuilderInput) => {
    setIsLoading(true);
    try {
      // Submit SIP plan
      const response = await fetch('/api/systematic-plans/sip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clientId: clientId || 1, // TODO: Get from context/route
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (onSIPCreated) {
          onSIPCreated(result.data);
        }
        // Switch to management tab to show the new plan
        setActiveTab('management');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create SIP plan');
      }
    } catch (error: any) {
      console.error('Failed to create SIP plan:', error);
      alert(error.message || 'Failed to create SIP plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            SIP (Systematic Investment Plan)
          </DialogTitle>
          <DialogDescription>
            Create and manage Systematic Investment Plans with flexible scheduling options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">My Plans</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-4">
            <SIPBuilderWizard
              products={products}
              onSubmit={handleSIPSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="calculator" className="mt-4">
            <SIPCalculator />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <SIPCalendar clientId={clientId} />
          </TabsContent>

          <TabsContent value="management" className="mt-4">
            <SystematicPlansList onModify={(plan) => {
              // Switch to builder tab for modification
              setActiveTab('builder');
            }} />
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <SIPPerformance clientId={clientId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

