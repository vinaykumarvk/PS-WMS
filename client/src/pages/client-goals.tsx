/**
 * Client Goals Page
 * Displays and manages goals for a specific client
 */

import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { ClientPageLayout } from '@/components/layout/ClientPageLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  GoalTrackingDashboard,
  GoalRecommendations,
  GoalTimeline,
} from './order-management/components/goals';
import { useGoal } from './order-management/hooks/use-goals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientGoalsPage() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'goals' | 'recommendations'>('goals');

  useEffect(() => {
    const path = window.location.hash;
    const match = path.match(/\/clients\/(\d+)/);
    if (match) {
      setClientId(parseInt(match[1]));
    }
  }, []);

  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await apiRequest('GET', `/api/clients/${clientId}`);
      const data = await response.json();
      return data.data || null;
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please select a client to view goals
      </div>
    );
  }

  return (
    <ClientPageLayout client={client} isLoading={isLoading} clientId={clientId}>
      {/* Page Title Band with Navigation */}
      <div className="bg-card border-b border-border px-3 py-4">
        <div className="flex justify-between items-center px-3 sm:px-5 mb-3">
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6" />
            Goals
          </h2>
        </div>
        
        {/* Navigation Icons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-1">
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/personal`}
            title="Personal Profile"
          >
            <span className="text-xs text-muted-foreground">Personal</span>
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/portfolio`}
            title="Portfolio"
          >
            <span className="text-xs text-muted-foreground">Portfolio</span>
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/transactions`}
            title="Transactions"
          >
            <span className="text-xs text-muted-foreground">Transactions</span>
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg bg-primary/10 border border-primary/20 h-12 w-full"
            title="Goals"
          >
            <Target className="h-6 w-6 text-primary" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'goals' | 'recommendations')} className="w-full">
          <TabsList>
            <TabsTrigger value="goals">My Goals</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GoalTrackingDashboard 
                  clientId={clientId}
                  onGoalSelect={(goal) => {
                    setSelectedGoalId(goal.id);
                  }}
                />
              </div>
              <div className="lg:col-span-1">
                {selectedGoalId ? (
                  <GoalTimelineWrapper goalId={selectedGoalId} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Goal Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Select a goal to view its timeline
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            {clientId ? (
              <GoalRecommendations 
                clientId={clientId}
                onApplyRecommendation={(recommendation) => {
                  // Handle recommendation application
                  console.log('Apply recommendation:', recommendation);
                  setSelectedGoalId(recommendation.goalId);
                  setActiveTab('goals');
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Please select a client to view recommendations
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientPageLayout>
  );
}

/**
 * Wrapper component to fetch goal details for timeline
 */
function GoalTimelineWrapper({ goalId }: { goalId: string }) {
  const { data: goal, isLoading } = useGoal(goalId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!goal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Goal not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <GoalTimeline
      goalId={goal.id}
      goalName={goal.name}
      targetDate={goal.targetDate}
    />
  );
}

