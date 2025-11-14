/**
 * Automation Features Page
 * Module 11: Automation Features
 * Main page for managing auto-invest rules, rebalancing, trigger orders, and notifications
 */

import React, { useState, useEffect } from 'react';
import { Settings, TrendingUp, Zap, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AutoInvestRules from './components/auto-invest-rules';
import RebalancingAutomation from './components/rebalancing-automation';
import TriggerConfig from './components/trigger-config';
import NotificationPreferences from './components/notification-preferences';

export default function AutomationPage() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'auto-invest' | 'rebalancing' | 'triggers' | 'notifications'>('auto-invest');

  useEffect(() => {
    // Extract clientId from URL hash if available
    const path = window.location.hash;
    const match = path.match(/\/clients\/(\d+)/);
    if (match) {
      setClientId(parseInt(match[1]));
    } else {
      // Default to client ID 1 for testing if no client in URL
      setClientId(1);
    }
  }, []);

  if (!clientId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please select a client to manage automation features
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Automation Features
            </h1>
            <p className="text-muted-foreground mt-2">
              Automate your investment strategies with smart rules and triggers
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auto-invest" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Auto-Invest
            </TabsTrigger>
            <TabsTrigger value="rebalancing" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Rebalancing
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Triggers
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto-invest" className="mt-6">
            <AutoInvestRules clientId={clientId} />
          </TabsContent>

          <TabsContent value="rebalancing" className="mt-6">
            <RebalancingAutomation clientId={clientId} />
          </TabsContent>

          <TabsContent value="triggers" className="mt-6">
            <TriggerConfig clientId={clientId} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationPreferences clientId={clientId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

