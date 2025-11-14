/**
 * Analytics Dashboard Page
 * Comprehensive analytics dashboard with order analytics, performance metrics, and client insights
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter, BarChart3, TrendingUp, Users, Download } from 'lucide-react';
import { useOrderAnalytics, usePerformanceMetrics, useClientInsights, AnalyticsFilters } from './analytics/hooks/use-analytics';
import { OrderAnalyticsComponent } from './analytics/components/order-analytics';
import { PerformanceMetricsComponent } from './analytics/components/performance-metrics';
import { ClientInsightsComponent } from './analytics/components/client-insights';
import { ExportOptionsComponent } from './analytics/components/export-options';

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: orderAnalytics, isLoading: ordersLoading } = useOrderAnalytics(filters);
  const { data: performanceMetrics, isLoading: performanceLoading } = usePerformanceMetrics(filters);
  const { data: clientInsights, isLoading: clientsLoading } = useClientInsights(filters);

  useEffect(() => {
    document.title = 'Analytics Dashboard | Wealth RM';
  }, []);

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

        {/* Analytics Tabs */}
        <Tabs defaultValue="orders" className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
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
      </div>
    </div>
  );
}

