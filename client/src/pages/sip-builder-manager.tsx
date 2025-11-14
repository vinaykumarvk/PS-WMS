/**
 * SIP Builder & Manager Page
 * Main page for Module C: SIP Builder & Manager
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calculator, Calendar, TrendingUp, Settings } from 'lucide-react';
import { Product } from './order-management/types/order.types';
import { apiRequest } from '@/lib/queryClient';
import { useSIP } from './order-management/hooks/use-sip';
import SIPBuilderWizard from './order-management/components/sip/sip-builder-wizard';
import SIPCalculator from './order-management/components/sip/sip-calculator';
import SIPCalendar from './order-management/components/sip/sip-calendar';
import SIPPerformanceTracker from './order-management/components/sip/sip-performance';
import SIPManagement from './order-management/components/sip/sip-management';
import { SIPBuilderInput } from '../../shared/types/sip.types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function SIPBuilderManagerPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'calculator' | 'calendar' | 'plans'>('builder');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showManagement, setShowManagement] = useState(false);

  // Get current user/client ID (in a real app, this would come from auth context)
  const clientId = 1; // Mock client ID

  // Fetch products for SIP builder
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/order-management/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-management/products');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Use SIP hook
  const {
    plans,
    isLoadingPlans,
    createSIP,
    pauseSIP,
    resumeSIP,
    modifySIP,
    cancelSIP,
    useSIPCalendar,
    useSIPPerformance,
    isCreating,
  } = useSIP(clientId);

  // Get calendar events for current month
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const { data: calendarEvents = [] } = useSIPCalendar(
    clientId,
    format(currentMonthStart, 'yyyy-MM-dd'),
    format(currentMonthEnd, 'yyyy-MM-dd')
  );

  // Get performance for selected plan
  const { data: performance } = useSIPPerformance(selectedPlanId || '');

  // Get selected plan
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleCreateSIP = async (data: SIPBuilderInput) => {
    await createSIP({ ...data, clientId });
    setActiveTab('plans');
  };

  const handleManagePlan = (planId: string) => {
    setSelectedPlanId(planId);
    setShowManagement(true);
  };

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            SIP Builder & Manager
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder">
              <Plus className="h-4 w-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="calculator">
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="plans">
              <TrendingUp className="h-4 w-4 mr-2" />
              My SIPs ({plans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            <SIPBuilderWizard
              products={products}
              onSubmit={handleCreateSIP}
              onCancel={() => setActiveTab('plans')}
              isLoading={isCreating}
            />
          </TabsContent>

          <TabsContent value="calculator" className="mt-6">
            <SIPCalculator />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <SIPCalendar
              events={calendarEvents}
              onDateClick={(date) => {
                console.log('Date clicked:', date);
              }}
            />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <div className="space-y-4">
              {isLoadingPlans ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      You don't have any SIP plans yet.
                    </p>
                    <Button onClick={() => setActiveTab('builder')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First SIP
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{plan.schemeName || `Scheme ${plan.schemeId}`}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Plan ID: {plan.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                plan.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : plan.status === 'Paused'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : plan.status === 'Cancelled'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {plan.status}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManagePlan(plan.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-semibold">₹{plan.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Frequency</p>
                            <p className="font-semibold">{plan.frequency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <p className="font-semibold">
                              {plan.completedInstallments} / {plan.installments}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Next Installment</p>
                            <p className="font-semibold">
                              {plan.nextInstallmentDate
                                ? format(new Date(plan.nextInstallmentDate), 'MMM dd, yyyy')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {selectedPlanId === plan.id && showManagement && (
                          <div className="mt-6 pt-6 border-t">
                            <SIPManagement
                              plan={plan}
                              onPause={async (planId, pauseUntil) => {
                                await pauseSIP({ planId, pauseUntil });
                                setShowManagement(false);
                              }}
                              onResume={async (planId) => {
                                await resumeSIP(planId);
                                setShowManagement(false);
                              }}
                              onModify={async (planId, updates) => {
                                await modifySIP({ planId, updates });
                                setShowManagement(false);
                              }}
                              onCancel={async (planId, reason) => {
                                await cancelSIP({ planId, reason });
                                setShowManagement(false);
                              }}
                            />
                          </div>
                        )}

                        {selectedPlanId === plan.id && performance && (
                          <div className="mt-6 pt-6 border-t">
                            <SIPPerformanceTracker
                              performance={performance}
                              planId={plan.id}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

