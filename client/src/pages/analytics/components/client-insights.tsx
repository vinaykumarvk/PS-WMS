/**
 * Client Insights Component
 * Displays client analytics and insights
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ClientInsights } from '../types/analytics.types';
import { Users, UserPlus, TrendingUp, Award } from 'lucide-react';

interface ClientInsightsProps {
  data?: ClientInsights;
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'];

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
    <div className="space-y-6">
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

