/**
 * Rebalancing Automation Component
 * Module 11.2: Rebalancing Automation
 */

import React, { useState } from 'react';
import { Plus, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRebalancingRules } from '../hooks/use-automation';
import type { RebalancingRule, CreateRebalancingRuleInput } from '@shared/types/automation.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface RebalancingAutomationProps {
  clientId: number;
}

export default function RebalancingAutomation({ clientId }: RebalancingAutomationProps) {
  const { rules, isLoading, createRule, executeRebalancing } = useRebalancingRules(clientId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreate = async (data: CreateRebalancingRuleInput) => {
    await createRule.mutateAsync(data);
    setShowCreateDialog(false);
  };

  const handleExecute = async (ruleId: string) => {
    if (confirm('Execute rebalancing now?')) {
      await executeRebalancing.mutateAsync(ruleId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading rebalancing rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Rebalancing Automation</h2>
          <p className="text-sm text-muted-foreground">
            Automatically rebalance your portfolio to maintain target allocation
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Rebalancing Rule</DialogTitle>
              <DialogDescription>
                Set up automatic portfolio rebalancing based on drift thresholds
              </DialogDescription>
            </DialogHeader>
            <RebalancingRuleForm
              clientId={clientId}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No rebalancing rules yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      <Badge variant={rule.isEnabled ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{rule.description || 'No description'}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecute(rule.id)}
                    disabled={!rule.isEnabled}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute Now
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Target Allocation</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(rule.targetAllocation).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground">{key}:</span>{' '}
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Threshold</p>
                      <p className="font-medium">{rule.thresholdPercent}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Strategy</p>
                      <p className="font-medium">{rule.strategy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Auto Execute</p>
                      <p className="font-medium">{rule.executeAutomatically ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Executions</p>
                      <p className="font-medium">{rule.executionCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface RebalancingRuleFormProps {
  clientId: number;
  onSubmit: (data: CreateRebalancingRuleInput) => void;
  onCancel: () => void;
}

function RebalancingRuleForm({ clientId, onSubmit, onCancel }: RebalancingRuleFormProps) {
  const [formData, setFormData] = useState<Partial<CreateRebalancingRuleInput>>({
    clientId,
    name: '',
    strategy: 'Threshold-Based',
    targetAllocation: { equity: 60, debt: 30, hybrid: 10 },
    thresholdPercent: 5,
    triggerOnDrift: true,
    triggerOnSchedule: false,
    executeAutomatically: false,
    requireConfirmation: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.targetAllocation) {
      onSubmit(formData as CreateRebalancingRuleInput);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Rule Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="equity">Equity Allocation (%)</Label>
          <Input
            id="equity"
            type="number"
            value={formData.targetAllocation?.equity || 0}
            onChange={(e) =>
              setFormData({
                ...formData,
                targetAllocation: {
                  ...formData.targetAllocation!,
                  equity: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="debt">Debt Allocation (%)</Label>
          <Input
            id="debt"
            type="number"
            value={formData.targetAllocation?.debt || 0}
            onChange={(e) =>
              setFormData({
                ...formData,
                targetAllocation: {
                  ...formData.targetAllocation!,
                  debt: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="threshold">Drift Threshold (%)</Label>
        <Input
          id="threshold"
          type="number"
          value={formData.thresholdPercent || 5}
          onChange={(e) => setFormData({ ...formData, thresholdPercent: parseFloat(e.target.value) })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="autoExecute">Execute Automatically</Label>
        <Switch
          id="autoExecute"
          checked={formData.executeAutomatically}
          onCheckedChange={(checked) => setFormData({ ...formData, executeAutomatically: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Rule</Button>
      </div>
    </form>
  );
}

