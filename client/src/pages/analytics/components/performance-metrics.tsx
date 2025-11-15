/**
 * Performance Metrics Component
 * Displays performance metrics with charts and KPIs
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { PerformanceMetrics, BenchmarkValueFormat } from '../types/analytics.types';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Target, Bot } from 'lucide-react';

const formatBenchmarkValue = (value: number, format: BenchmarkValueFormat) => {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString('en-IN', { maximumFractionDigits: 1 });
  }
};

const formatVariance = (variance: number) => `${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`;

const getDirectionClass = (direction: 'above' | 'below' | 'on_track') => {
  switch (direction) {
    case 'above':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    case 'below':
      return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

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
    <div className="space-y-6" data-testid="performance-metrics-content">
      {data.narrative && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bot className="h-5 w-5" />
              {data.narrative.headline}
            </CardTitle>
            <CardDescription>{data.narrative.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {data.narrative.supportingPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.benchmarks && data.benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparative insights</CardTitle>
            <CardDescription>Benchmarks from the analytics model vs. realised performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.benchmarks.map((benchmark, index) => (
              <div key={`${benchmark.metric}-${index}`} className="rounded-lg border border-dashed border-muted-foreground/40 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{benchmark.metric}</p>
                    {benchmark.narrative && (
                      <p className="text-sm text-muted-foreground">{benchmark.narrative}</p>
                    )}
                  </div>
                  <Badge className={getDirectionClass(benchmark.direction)}>
                    {benchmark.direction === 'above'
                      ? 'Above benchmark'
                      : benchmark.direction === 'below'
                      ? 'Below benchmark'
                      : 'On track'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-medium text-foreground">
                    Current: {formatBenchmarkValue(benchmark.currentValue, benchmark.format)}
                  </span>
                  <span className="text-muted-foreground">
                    Benchmark: {formatBenchmarkValue(benchmark.benchmarkValue, benchmark.format)}
                  </span>
                  <span className={benchmark.variance >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}>
                    Δ {formatVariance(benchmark.variance)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

