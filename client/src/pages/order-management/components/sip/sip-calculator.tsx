/**
 * SIP Calculator Component
 * Calculates and displays SIP returns with projections
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Calculator as CalculatorIcon, Info } from 'lucide-react';
import { SIPCalculatorInput, SIPCalculatorResult, SIPFrequency } from '../../../../../../shared/types/sip.types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SIPCalculatorProps {
  onCalculate?: (result: SIPCalculatorResult) => void;
}

const FREQUENCY_OPTIONS: { value: SIPFrequency; label: string }[] = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Daily', label: 'Daily' },
];

export default function SIPCalculator({ onCalculate }: SIPCalculatorProps) {
  const [input, setInput] = useState<SIPCalculatorInput>({
    amount: 5000,
    frequency: 'Monthly',
    duration: 12,
    expectedReturn: 12,
  });
  const [result, setResult] = useState<SIPCalculatorResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate SIP returns
  const calculateSIP = async () => {
    setIsCalculating(true);
    try {
      // Calculate monthly breakdown
      const monthlyBreakdown: any[] = [];
      const monthlyRate = input.expectedReturn / 100 / 12;
      const installmentsPerMonth = input.frequency === 'Monthly' ? 1 :
                                   input.frequency === 'Quarterly' ? 1/3 :
                                   input.frequency === 'Weekly' ? 4 :
                                   30;
      
      let cumulativeInvested = 0;
      let cumulativeValue = 0;

      for (let month = 1; month <= input.duration; month++) {
        const invested = input.amount * installmentsPerMonth;
        cumulativeInvested += invested;
        
        // Calculate value with compound interest
        cumulativeValue = (cumulativeValue + invested) * (1 + monthlyRate);
        
        const returns = cumulativeValue - cumulativeInvested;
        const returnPercentage = (returns / cumulativeInvested) * 100;

        monthlyBreakdown.push({
          month,
          date: new Date(2024, 0, month * (input.frequency === 'Monthly' ? 30 : 1)).toISOString().split('T')[0],
          invested,
          cumulativeInvested,
          value: cumulativeValue,
          returns,
          returnPercentage,
        });
      }

      const calculatedResult: SIPCalculatorResult = {
        totalInvested: cumulativeInvested,
        expectedValue: cumulativeValue,
        estimatedReturns: cumulativeValue - cumulativeInvested,
        returnPercentage: ((cumulativeValue - cumulativeInvested) / cumulativeInvested) * 100,
        monthlyBreakdown,
        summary: {
          totalInstallments: Math.ceil(input.duration * installmentsPerMonth),
          averageNAV: 100, // Placeholder
          finalNAV: 100 * Math.pow(1 + monthlyRate, input.duration), // Placeholder
        },
      };

      setResult(calculatedResult);
      if (onCalculate) {
        onCalculate(calculatedResult);
      }
    } catch (error) {
      console.error('Error calculating SIP:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculateSIP();
  }, [input.amount, input.frequency, input.duration, input.expectedReturn]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5" />
          <CardTitle>SIP Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Investment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="1000"
              step="100"
              value={input.amount}
              onChange={(e) => setInput({ ...input, amount: parseFloat(e.target.value) || 0 })}
            />
            <Slider
              value={[input.amount]}
              onValueChange={([value]) => setInput({ ...input, amount: value })}
              min={1000}
              max={100000}
              step={1000}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹1,000</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={input.frequency}
              onValueChange={(value) => setInput({ ...input, frequency: value as SIPFrequency })}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Investment Duration (Months)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="360"
              value={input.duration}
              onChange={(e) => setInput({ ...input, duration: parseInt(e.target.value) || 1 })}
            />
            <Slider
              value={[input.duration]}
              onValueChange={([value]) => setInput({ ...input, duration: value })}
              min={1}
              max={360}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 month</span>
              <span>30 years</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedReturn">Expected Annual Return (%)</Label>
            <Input
              id="expectedReturn"
              type="number"
              min="1"
              max="30"
              step="0.5"
              value={input.expectedReturn}
              onChange={(e) => setInput({ ...input, expectedReturn: parseFloat(e.target.value) || 0 })}
            />
            <Slider
              value={[input.expectedReturn]}
              onValueChange={([value]) => setInput({ ...input, expectedReturn: value })}
              min={1}
              max={30}
              step={0.5}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These are estimated returns based on the expected return rate. Actual returns may vary.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.totalInvested)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Expected Value</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(result.expectedValue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Estimated Returns</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(result.estimatedReturns)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({result.returnPercentage.toFixed(2)}%)
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growth Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={result.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeInvested" 
                      stroke="#8884d8" 
                      name="Invested"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#82ca9d" 
                      name="Expected Value"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

