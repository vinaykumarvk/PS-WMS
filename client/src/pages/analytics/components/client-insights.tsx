/**
 * Client Insights Component
 * Displays client analytics and insights
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ClientInsights, BenchmarkValueFormat } from '../types/analytics.types';
import { Users, UserPlus, TrendingUp, Award, Bot } from 'lucide-react';

interface ClientInsightsProps {
  data?: ClientInsights;
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'];

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

export function ClientInsightsComponent({ data, isLoading }: ClientInsightsProps) {
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
          <p className="text-sm text-muted-foreground">No client insights data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="client-insights-content">
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
            <CardDescription>Engagement benchmarks vs. portfolio realities</CardDescription>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold mt-1">{data.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold mt-1">{data.activeClients}</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {data.totalClients > 0 ? ((data.activeClients / data.totalClients) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Clients</p>
                <p className="text-2xl font-bold mt-1">{data.newClients}</p>
                <p className="text-xs mt-1 text-muted-foreground">Last 30 days</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold mt-1">{data.clientRetentionRate.toFixed(1)}%</p>
                <p className="text-xs mt-1 text-muted-foreground">Client retention</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Clients by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.clientsByTier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Clients']} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Client Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Clients by Risk Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Clients by Risk Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.clientsByRiskProfile}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ riskProfile, percent }) => `${riskProfile}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.clientsByRiskProfile.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Acquisition Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Client Acquisition Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.clientAcquisitionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, 'New Clients']} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="New Clients" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Segmentation by AUM */}
        <Card>
          <CardHeader>
            <CardTitle>Client Segmentation by AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.clientSegmentation.byAUM}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, 'Clients']} />
                <Legend />
                <Bar dataKey="count" fill="#14b8a6" name="Client Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Client Segmentation by Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Client Segmentation by Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.clientSegmentation.byActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value, 'Clients']} />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Client Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Client Name</th>
                  <th className="text-right p-2">AUM</th>
                  <th className="text-right p-2">Orders</th>
                  <th className="text-right p-2">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((client) => (
                  <tr key={client.clientId} className="border-b">
                    <td className="p-2">{client.clientName}</td>
                    <td className="text-right p-2">{formatCurrency(client.aum)}</td>
                    <td className="text-right p-2">{client.orderCount}</td>
                    <td className="text-right p-2">
                      {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

