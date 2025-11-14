/**
 * Auto-Invest Rules Component
 * Module 11.1: Auto-Invest Rules
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, Pause, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAutoInvestRules } from '../hooks/use-automation';
import type { AutoInvestRule, CreateAutoInvestRuleInput } from '@shared/types/automation.types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AutoInvestRulesProps {
  clientId: number;
}

export default function AutoInvestRules({ clientId }: AutoInvestRulesProps) {
  const { rules, isLoading, createRule, updateRule, deleteRule } = useAutoInvestRules(clientId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoInvestRule | null>(null);

  const handleCreate = async (data: CreateAutoInvestRuleInput) => {
    await createRule.mutateAsync(data);
    setShowCreateDialog(false);
  };

  const handleToggle = async (rule: AutoInvestRule) => {
    await updateRule.mutateAsync({
      ruleId: rule.id,
      updates: { isEnabled: !rule.isEnabled },
    });
  };

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this auto-invest rule?')) {
      await deleteRule.mutateAsync(ruleId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading auto-invest rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Auto-Invest Rules</h2>
          <p className="text-sm text-muted-foreground">
            Automatically invest in mutual funds based on your rules
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
              <DialogTitle>Create Auto-Invest Rule</DialogTitle>
              <DialogDescription>
                Set up an automated investment rule that will execute based on your preferences
              </DialogDescription>
            </DialogHeader>
            <AutoInvestRuleForm
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
            <p className="text-muted-foreground mb-4">No auto-invest rules yet</p>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.isEnabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Scheme</p>
                    <p className="font-medium">{rule.schemeName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">₹{rule.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frequency</p>
                    <p className="font-medium">{rule.frequency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Execution</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {rule.nextExecutionDate || 'N/A'}
                    </p>
                  </div>
                </div>
                {rule.executionCount > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Executed {rule.executionCount} time{rule.executionCount !== 1 ? 's' : ''}
                      {rule.lastExecutionDate && ` • Last: ${new Date(rule.lastExecutionDate).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Auto-Invest Rule</DialogTitle>
            </DialogHeader>
            <AutoInvestRuleForm
              clientId={clientId}
              rule={editingRule}
              onSubmit={async (data) => {
                await updateRule.mutateAsync({
                  ruleId: editingRule.id,
                  updates: data as any,
                });
                setEditingRule(null);
              }}
              onCancel={() => setEditingRule(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface AutoInvestRuleFormProps {
  clientId: number;
  rule?: AutoInvestRule;
  onSubmit: (data: CreateAutoInvestRuleInput) => void;
  onCancel: () => void;
}

function AutoInvestRuleForm({ clientId, rule, onSubmit, onCancel }: AutoInvestRuleFormProps) {
  const [formData, setFormData] = useState<Partial<CreateAutoInvestRuleInput>>({
    clientId,
    name: rule?.name || '',
    description: rule?.description || '',
    schemeId: rule?.schemeId || 0,
    amount: rule?.amount || 0,
    frequency: rule?.frequency || 'Monthly',
    triggerType: rule?.triggerType || 'Date',
    triggerConfig: rule?.triggerConfig || {},
    startDate: rule?.startDate || new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.schemeId && formData.amount && formData.startDate) {
      onSubmit(formData as CreateAutoInvestRuleInput);
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

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="schemeId">Scheme ID *</Label>
          <Input
            id="schemeId"
            type="number"
            value={formData.schemeId || ''}
            onChange={(e) => setFormData({ ...formData, schemeId: parseInt(e.target.value) })}
            required
          />
        </div>

        <div>
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
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

