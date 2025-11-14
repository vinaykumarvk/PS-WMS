/**
 * Trigger Configuration Component
 * Module 11.3: Trigger-Based Orders
 */

import React, { useState } from 'react';
import { Plus, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTriggerOrders } from '../hooks/use-automation';
import type { TriggerOrder, CreateTriggerOrderInput } from '@shared/types/automation.types';
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

interface TriggerConfigProps {
  clientId: number;
}

export default function TriggerConfig({ clientId }: TriggerConfigProps) {
  const { orders, isLoading, createOrder } = useTriggerOrders(clientId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreate = async (data: CreateTriggerOrderInput) => {
    await createOrder.mutateAsync(data);
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading trigger orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Trigger Orders</h2>
          <p className="text-sm text-muted-foreground">
            Set up orders that execute automatically when conditions are met
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Trigger Order</DialogTitle>
              <DialogDescription>
                Set up an order that will execute automatically when trigger conditions are met
              </DialogDescription>
            </DialogHeader>
            <TriggerOrderForm
              clientId={clientId}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No trigger orders yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trigger
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {order.name}
                      <Badge variant={order.status === 'Active' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{order.description || 'No description'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Trigger Type</p>
                      <p className="font-medium">{order.triggerType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium">{order.triggerCondition}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trigger Value</p>
                      <p className="font-medium">{order.triggerValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order Type</p>
                      <p className="font-medium">{order.orderType}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Scheme</p>
                      <p className="font-medium">{order.schemeName}</p>
                    </div>
                    {order.amount && (
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{order.amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {order.goalId && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Goal:</span>
                      <span className="font-medium">{order.goalName || order.goalId}</span>
                    </div>
                  )}
                  {order.triggeredAt && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Triggered: {new Date(order.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface TriggerOrderFormProps {
  clientId: number;
  onSubmit: (data: CreateTriggerOrderInput) => void;
  onCancel: () => void;
}

function TriggerOrderForm({ clientId, onSubmit, onCancel }: TriggerOrderFormProps) {
  const [formData, setFormData] = useState<Partial<CreateTriggerOrderInput>>({
    clientId,
    name: '',
    triggerType: 'Price',
    triggerCondition: 'Greater Than',
    triggerValue: 0,
    orderType: 'Purchase',
    schemeId: 0,
    amount: 0,
    validFrom: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.schemeId && formData.amount) {
      onSubmit(formData as CreateTriggerOrderInput);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Trigger Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="triggerType">Trigger Type *</Label>
          <Select
            value={formData.triggerType}
            onValueChange={(value) => setFormData({ ...formData, triggerType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Price">Price</SelectItem>
              <SelectItem value="NAV">NAV</SelectItem>
              <SelectItem value="Portfolio Value">Portfolio Value</SelectItem>
              <SelectItem value="Goal Progress">Goal Progress</SelectItem>
              <SelectItem value="Date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="triggerCondition">Condition *</Label>
          <Select
            value={formData.triggerCondition}
            onValueChange={(value) => setFormData({ ...formData, triggerCondition: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Greater Than">Greater Than</SelectItem>
              <SelectItem value="Less Than">Less Than</SelectItem>
              <SelectItem value="Equals">Equals</SelectItem>
              <SelectItem value="Crosses Above">Crosses Above</SelectItem>
              <SelectItem value="Crosses Below">Crosses Below</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="triggerValue">Trigger Value *</Label>
          <Input
            id="triggerValue"
            type="number"
            value={formData.triggerValue || ''}
            onChange={(e) => setFormData({ ...formData, triggerValue: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div>
          <Label htmlFor="orderType">Order Type *</Label>
          <Select
            value={formData.orderType}
            onValueChange={(value) => setFormData({ ...formData, orderType: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Purchase">Purchase</SelectItem>
              <SelectItem value="Redemption">Redemption</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <div>
        <Label htmlFor="validFrom">Valid From *</Label>
        <Input
          id="validFrom"
          type="date"
          value={formData.validFrom}
          onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Trigger</Button>
      </div>
    </form>
  );
}

