/**
 * Analytics Dashboard Page
 * Comprehensive analytics dashboard with order analytics, performance metrics, and client insights
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Filter, BarChart3, TrendingUp, Users, Download, MessageSquare, Bot, Send } from 'lucide-react';
import { useOrderAnalytics, usePerformanceMetrics, useClientInsights, AnalyticsFilters } from './analytics/hooks/use-analytics';
import { OrderAnalyticsComponent } from './analytics/components/order-analytics';
import { PerformanceMetricsComponent } from './analytics/components/performance-metrics';
import { ClientInsightsComponent } from './analytics/components/client-insights';
import { ExportOptionsComponent } from './analytics/components/export-options';
import { AnalyticsRecommendations } from './analytics/components/action-recommendations';
import { deriveKpiRecommendations } from './analytics/utils/insight-generators';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I can dig into your analytics. Ask about AUM, revenue, conversion, or top clients to get tailored insights.'
    }
  ]);
  const [activeTab, setActiveTab] = useState<'orders' | 'performance' | 'clients'>('orders');

  const { data: orderAnalytics, isLoading: ordersLoading } = useOrderAnalytics(filters);
  const { data: performanceMetrics, isLoading: performanceLoading } = usePerformanceMetrics(filters);
  const { data: clientInsights, isLoading: clientsLoading } = useClientInsights(filters);

  useEffect(() => {
    document.title = 'Analytics Dashboard | Wealth RM';
  }, []);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }), []);
  const percentFormatter = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: 1,
  }), []);

  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | '1y' | 'custom') => {
    const today = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return; // Keep custom dates
    }

    setFilters({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  const isLoading = ordersLoading || performanceLoading || clientsLoading;

  const recommendations = useMemo(
    () =>
      deriveKpiRecommendations({
        orderAnalytics,
        performanceMetrics,
        clientInsights,
      }),
    [orderAnalytics, performanceMetrics, clientInsights],
  );

  const generateAgentResponse = (question: string) => {
    const lower = question.toLowerCase();
    const responses: string[] = [];

    if (!orderAnalytics || !performanceMetrics || !clientInsights) {
      return 'Analytics are still loading. Try again once the dashboard metrics finish syncing.';
    }

    if (lower.includes('aum') || lower.includes('assets')) {
      responses.push(`Total AUM stands at ${currencyFormatter.format(performanceMetrics.totalAUM)} with ${percentFormatter.format(performanceMetrics.growthMetrics.aumGrowth / 100)} change versus the prior period.`);
    }

    if (lower.includes('revenue')) {
      responses.push(`Revenue is tracking at ${currencyFormatter.format(performanceMetrics.totalRevenue)}, ${performanceMetrics.growthMetrics.revenueGrowth >= 0 ? 'up' : 'down'} ${Math.abs(performanceMetrics.growthMetrics.revenueGrowth).toFixed(1)}% period over period.`);
    }

    if (lower.includes('order') || lower.includes('conversion')) {
      responses.push(`You have processed ${orderAnalytics.totalOrders.toLocaleString('en-IN')} orders with an average value of ${currencyFormatter.format(performanceMetrics.averageOrderValue)} and a success rate of ${percentFormatter.format(performanceMetrics.orderSuccessRate / 100)}.`);
    }

    if (lower.includes('retention') || lower.includes('loyalty')) {
      responses.push(`Client retention is holding at ${percentFormatter.format(clientInsights.clientRetentionRate / 100)} with ${clientInsights.newClients.toLocaleString('en-IN')} new clients this period.`);
    }

    if (lower.includes('top client') || lower.includes('top-client') || lower.includes('top accounts')) {
      const leader = orderAnalytics.topClients?.[0];
      if (leader) {
        responses.push(`Top client: ${leader.clientName} with ${leader.orderCount} orders totalling ${currencyFormatter.format(leader.totalValue)}.`);
      }
    }

    if (!responses.length) {
      responses.push(`Overall, AUM is ${currencyFormatter.format(performanceMetrics.totalAUM)}, revenue is ${currencyFormatter.format(performanceMetrics.totalRevenue)}, and retention is ${percentFormatter.format(clientInsights.clientRetentionRate / 100)}. Ask about AUM, revenue, retention, or top clients for specifics.`);
    }

    return responses.join(' ');
  };

  const handleAgentSubmit = () => {
    const prompt = agentInput.trim();
    if (!prompt) return;
    const response = generateAgentResponse(prompt);
    setAgentMessages((prev) => [
      ...prev,
      { role: 'user', content: prompt },
      { role: 'assistant', content: response }
    ]);
    setAgentInput('');
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-12 lg:pb-16">
        {/* Header */}
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">
                Comprehensive insights and performance metrics
              </p>
            </div>
            <ExportOptionsComponent
              orderAnalytics={orderAnalytics}
              performanceMetrics={performanceMetrics}
              clientInsights={clientInsights}
            />
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Quick Date Range */}
              <div className="space-y-2">
                <Label>Quick Date Range</Label>
                <Select
                  value="custom"
                  onValueChange={(value) => handleDateRangeChange(value as '7d' | '30d' | '90d' | '1y' | 'custom')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
                      .toISOString()
                      .split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                  })
                }
              >
                Reset Filters
              </Button>
            </div>
        </CardContent>
      </Card>

      <AnalyticsRecommendations recommendations={recommendations} isLoading={isLoading} />

      <Card className="mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-250">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Analytics Assistant
            </CardTitle>
            <CardDescription>
              Ask a question and the assistant will reference live analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground flex-1">
              Curious about AUM momentum, revenue, or client retention? Launch the conversational agent to query the data directly.
            </p>
            <Button variant="outline" className="gap-2" onClick={() => setAgentOpen(true)}>
              <Bot className="h-4 w-4" />
              Open Assistant
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'orders' | 'performance' | 'clients')}
          className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-300"
        >
          <TabsList className="bg-muted/50 border border-border/50 rounded-xl p-1 h-auto shadow-sm hover:shadow-md transition-all duration-300">
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-background/50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Order Analytics
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-background/50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-background/50"
            >
              <Users className="w-4 h-4 mr-2" />
              Client Insights
            </TabsTrigger>
          </TabsList>

          {/* Order Analytics Tab */}
          <TabsContent value="orders" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <OrderAnalyticsComponent data={orderAnalytics} isLoading={ordersLoading} />
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="performance" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <PerformanceMetricsComponent data={performanceMetrics} isLoading={performanceLoading} />
          </TabsContent>

          {/* Client Insights Tab */}
          <TabsContent value="clients" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <ClientInsightsComponent data={clientInsights} isLoading={clientsLoading} />
          </TabsContent>
        </Tabs>
        <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4" /> Analytics Assistant
              </DialogTitle>
              <DialogDescription>
                Responses are generated from the current analytics data set.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-72 overflow-y-auto space-y-3 py-2">
              {agentMessages.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground border-primary/80'
                        : 'bg-muted text-foreground border-border'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <Textarea
                value={agentInput}
                onChange={(event) => setAgentInput(event.target.value)}
                rows={3}
                placeholder="Ask about AUM growth, revenue trends, or retention."
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleAgentSubmit();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAgentSubmit}
                disabled={!agentInput.trim()}
                className="h-10 gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

