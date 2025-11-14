/**
 * SIP Performance Tracker Component
 * Displays SIP performance metrics and comparison with lump sum
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { SIPPerformance } from '../../../../../../shared/types/sip.types';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

interface SIPPerformanceProps {
  performance: SIPPerformance;
  planId: string;
}

export default function SIPPerformanceTracker({ performance, planId }: SIPPerformanceProps) {
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const isPositive = performance.gainLoss >= 0;

  // Generate performance data for chart (mock data for visualization)
  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    sipValue: performance.currentValue * (i + 1) / 12,
    lumpSumValue: performance.vsLumpSum.lumpSumValue * (i + 1) / 12,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>SIP Performance</CardTitle>
            </div>
            <Badge variant={isPositive ? 'default' : 'destructive'}>
              {formatPercentage(performance.gainLossPercent)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(performance.totalInvested)}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(performance.currentValue)}
                </p>
              </CardContent>
            </Card>

            <Card className={`bg-muted/50 ${isPositive ? 'border-green-200' : 'border-red-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Gain/Loss</p>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(performance.gainLoss)}
                </p>
                <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(performance.gainLossPercent)}
                </p>
              </CardContent>
            </Card>
          </div>

          {performance.xirr && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">XIRR (Extended Internal Rate of Return)</p>
                    <p className="text-2xl font-bold">{formatPercentage(performance.xirr)}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Annualized Return
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SIP vs Lump Sum Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lump Sum Value</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(performance.vsLumpSum.lumpSumValue)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">SIP Value</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatCurrency(performance.vsLumpSum.sipValue)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difference</span>
                  <span className={`font-semibold ${
                    performance.vsLumpSum.difference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(performance.vsLumpSum.difference)} (
                    {formatPercentage(performance.vsLumpSum.differencePercent)})
                  </span>
                </div>
                <Progress 
                  value={Math.abs(performance.vsLumpSum.differencePercent)} 
                  className="h-2"
                />
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="lumpSumValue" fill="#8884d8" name="Lump Sum" />
                  <Bar dataKey="sipValue" fill="#82ca9d" name="SIP Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

