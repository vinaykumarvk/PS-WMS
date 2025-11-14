/**
 * SIP Builder Wizard Component
 * Multi-step wizard for creating SIP plans with guided flow
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Calculator, Calendar, TrendingUp } from 'lucide-react';
import { Product } from '../../types/order.types';
import { SIPBuilderInput, SIPFrequency } from '../../../../../../shared/types/sip.types';
import { format } from 'date-fns';

interface SIPBuilderWizardProps {
  products: Product[];
  onSubmit: (data: SIPBuilderInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type WizardStep = 'scheme' | 'amount' | 'schedule' | 'review';

const STEPS: WizardStep[] = ['scheme', 'amount', 'schedule', 'review'];
const STEP_LABELS = {
  scheme: 'Select Scheme',
  amount: 'Investment Amount',
  schedule: 'Schedule',
  review: 'Review & Confirm',
};

const FREQUENCY_OPTIONS: { value: SIPFrequency; label: string; description: string }[] = [
  { value: 'Daily', label: 'Daily', description: 'Invest every day' },
  { value: 'Weekly', label: 'Weekly', description: 'Invest once a week' },
  { value: 'Monthly', label: 'Monthly', description: 'Invest once a month' },
  { value: 'Quarterly', label: 'Quarterly', description: 'Invest every quarter' },
];

export default function SIPBuilderWizard({ products, onSubmit, onCancel, isLoading = false }: SIPBuilderWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<SIPBuilderInput>({
    schemeId: 0,
    amount: 0,
    frequency: 'Monthly',
    startDate: '',
    installments: 12,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProduct = products.find(p => p.id === formData.schemeId);
  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (STEPS[stepIndex]) {
      case 'scheme':
        if (!formData.schemeId || formData.schemeId === 0) {
          newErrors.schemeId = 'Please select a scheme';
        }
        break;

      case 'amount':
        if (formData.amount < 1000) {
          newErrors.amount = 'SIP amount must be at least ₹1,000';
        }
        if (selectedProduct && formData.amount < selectedProduct.minInvestment) {
          newErrors.amount = `Minimum investment is ₹${selectedProduct.minInvestment.toLocaleString()}`;
        }
        if (selectedProduct && selectedProduct.maxInvestment && formData.amount > selectedProduct.maxInvestment) {
          newErrors.amount = `Maximum investment is ₹${selectedProduct.maxInvestment.toLocaleString()}`;
        }
        break;

      case 'schedule':
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required';
        } else {
          const startDate = new Date(formData.startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (startDate <= today) {
            newErrors.startDate = 'Start date must be a future date';
          }
        }
        if (!formData.installments || formData.installments < 1) {
          newErrors.installments = 'Number of installments must be at least 1';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit(formData);
    }
  };

  const calculateEndDate = (): string | undefined => {
    if (!formData.startDate || !formData.installments) return undefined;
    
    const start = new Date(formData.startDate);
    const months = formData.frequency === 'Monthly' ? formData.installments :
                   formData.frequency === 'Quarterly' ? formData.installments * 3 :
                   formData.frequency === 'Weekly' ? Math.ceil(formData.installments / 4) :
                   Math.ceil(formData.installments / 30);
    
    const end = new Date(start);
    end.setMonth(start.getMonth() + months);
    return end.toISOString().split('T')[0];
  };

  const calculateTotalInvestment = (): number => {
    return formData.amount * (formData.installments || 0);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'scheme':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schemeId">Select Mutual Fund Scheme *</Label>
              <Select
                value={formData.schemeId.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, schemeId: parseInt(value) });
                  setErrors({});
                }}
              >
                <SelectTrigger id="schemeId">
                  <SelectValue placeholder="Choose a scheme" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.schemeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.schemeId && (
                <p className="text-sm text-destructive">{errors.schemeId}</p>
              )}
            </div>

            {selectedProduct && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{selectedProduct.schemeName}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{selectedProduct.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min Investment:</span>
                        <p className="font-medium">₹{selectedProduct.minInvestment.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'amount':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">SIP Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="100"
                value={formData.amount || ''}
                onChange={(e) => {
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
                  setErrors({});
                }}
                placeholder="Enter amount (minimum ₹1,000)"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[5000, 10000, 25000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ ...formData, amount: preset });
                    setErrors({});
                  }}
                  className={formData.amount === preset ? 'border-primary' : ''}
                >
                  ₹{preset.toLocaleString()}
                </Button>
              ))}
            </div>

            {selectedProduct && formData.amount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>Minimum: ₹{selectedProduct.minInvestment.toLocaleString()}</p>
                    {selectedProduct.maxInvestment && (
                      <p>Maximum: ₹{selectedProduct.maxInvestment.toLocaleString()}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => {
                  setFormData({ ...formData, frequency: value as SIPFrequency });
                }}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  setErrors({});
                }}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Number of Installments *</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={formData.installments || ''}
                onChange={(e) => {
                  setFormData({ ...formData, installments: parseInt(e.target.value) || 0 });
                  setErrors({});
                }}
                placeholder="e.g., 12"
              />
              {errors.installments && (
                <p className="text-sm text-destructive">{errors.installments}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Total investment: ₹{calculateTotalInvestment().toLocaleString()}
              </p>
            </div>
          </div>
        );

      case 'review':
        const endDate = calculateEndDate();
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Review Your SIP Plan</h3>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Scheme</p>
                      <p className="font-medium">{selectedProduct?.schemeName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount per Installment</p>
                      <p className="font-medium">₹{formData.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{formData.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Installments</p>
                      <p className="font-medium">{formData.installments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {formData.startDate ? format(new Date(formData.startDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    {endDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">End Date (Estimated)</p>
                        <p className="font-medium">{format(new Date(endDate), 'MMM dd, yyyy')}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Total Investment</p>
                      <p className="text-2xl font-bold">₹{calculateTotalInvestment().toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>SIP Builder</CardTitle>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {STEPS.map((s, idx) => (
              <div
                key={s}
                className={`flex items-center gap-1 ${
                  idx <= currentStep ? 'text-primary font-medium' : ''
                }`}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    idx === currentStep ? 'border-primary bg-primary' : 'border-muted'
                  }`} />
                )}
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-6 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handlePrevious}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create SIP Plan'}
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

