/**
 * Performance Metrics Component
 * Displays performance metrics with charts and KPIs
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getPercentageChangeColor } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PerformanceMetrics } from '../types/analytics.types';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Target } from 'lucide-react';

interface PerformanceMetricsProps {
  data?: PerformanceMetrics;
  isLoading: boolean;
}

export function PerformanceMetricsComponent({ data, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No performance metrics data available</p>
        </CardContent>
      </Card>
    );
  }

  const growthMetrics = [
    {
      label: 'AUM Growth',
      value: data.growthMetrics.aumGrowth,
      icon: TrendingUp,
      color: data.growthMetrics.aumGrowth >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Client Growth',
      value: data.growthMetrics.clientGrowth,
      icon: Users,
      color: data.growthMetrics.clientGrowth >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Order Growth',
      value: data.growthMetrics.orderGrowth,
      icon: Activity,
      color: data.growthMetrics.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'Revenue Growth',
      value: data.growthMetrics.revenueGrowth,
      icon: DollarSign,
      color: data.growthMetrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total AUM</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalAUM)}</p>
                <p className={`text-xs mt-1 ${getPercentageChangeColor(data.growthMetrics.aumGrowth)}`}>
                  {data.growthMetrics.aumGrowth >= 0 ? '+' : ''}
                  {data.growthMetrics.aumGrowth.toFixed(1)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold mt-1">{data.totalClients}</p>
                <p className={`text-xs mt-1 ${getPercentageChangeColor(data.growthMetrics.clientGrowth)}`}>
                  {data.growthMetrics.clientGrowth >= 0 ? '+' : ''}
                  {data.growthMetrics.clientGrowth.toFixed(1)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data.totalRevenue)}</p>
                <p className={`text-xs mt-1 ${getPercentageChangeColor(data.growthMetrics.revenueGrowth)}`}>
                  {data.growthMetrics.revenueGrowth >= 0 ? '+' : ''}
                  {data.growthMetrics.revenueGrowth.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold mt-1">{data.orderSuccessRate.toFixed(1)}%</p>
                <p className="text-xs mt-1 text-muted-foreground">Order completion</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {growthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${metric.color}`}>
                      {metric.value >= 0 ? '+' : ''}
                      {metric.value.toFixed(1)}%
                    </p>
                  </div>
                  {metric.value >= 0 ? (
                    <TrendingUp className={`h-8 w-8 ${metric.color}`} />
                  ) : (
                    <TrendingDown className={`h-8 w-8 ${metric.color}`} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                <Legend />
                <Line type="monotone" dataKey="aum" stroke="#3b82f6" name="AUM" />
                <Line type="monotone" dataKey="revenue" stroke="#14b8a6" name="Revenue" />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
                <Bar yAxisId="right" dataKey="revenue" fill="#14b8a6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(data.averageOrderValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Client Retention Rate</p>
            <p className="text-2xl font-bold mt-1">{data.clientRetentionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Average Client Value</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(data.averageClientValue)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

