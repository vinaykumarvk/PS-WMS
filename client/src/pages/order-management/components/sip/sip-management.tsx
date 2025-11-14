/**
 * SIP Management Component
 * Handles pause, resume, modify, and cancel operations for SIP plans
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pause, Play, Edit, X, AlertTriangle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SIPPlan, SIPFrequency } from '../../../../../../shared/types/sip.types';
import { format } from 'date-fns';

interface SIPManagementProps {
  plan: SIPPlan;
  onPause: (planId: string, pauseUntil?: string) => Promise<void>;
  onResume: (planId: string) => Promise<void>;
  onModify: (planId: string, updates: { newAmount?: number; newFrequency?: SIPFrequency }) => Promise<void>;
  onCancel: (planId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SIPManagement({
  plan,
  onPause,
  onResume,
  onModify,
  onCancel,
  isLoading = false,
}: SIPManagementProps) {
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pauseUntil, setPauseUntil] = useState('');
  const [modifyData, setModifyData] = useState({
    newAmount: plan.amount,
    newFrequency: plan.frequency,
  });
  const [cancelReason, setCancelReason] = useState('');

  const canModify = plan.status === 'Active' && !plan.pausedAt;
  const canPause = plan.status === 'Active' && !plan.pausedAt;
  const canResume = plan.status === 'Paused';
  const canCancel = plan.status === 'Active' || plan.status === 'Paused';

  const handlePause = async () => {
    try {
      await onPause(plan.id, pauseUntil || undefined);
      setShowPauseDialog(false);
      setPauseUntil('');
      toast({
        title: 'SIP Paused',
        description: 'Your SIP plan has been paused successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to pause SIP',
        variant: 'destructive',
      });
    }
  };

  const handleResume = async () => {
    try {
      await onResume(plan.id);
      toast({
        title: 'SIP Resumed',
        description: 'Your SIP plan has been resumed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume SIP',
        variant: 'destructive',
      });
    }
  };

  const handleModify = async () => {
    try {
      await onModify(plan.id, {
        newAmount: modifyData.newAmount !== plan.amount ? modifyData.newAmount : undefined,
        newFrequency: modifyData.newFrequency !== plan.frequency ? modifyData.newFrequency : undefined,
      });
      setShowModifyDialog(false);
      toast({
        title: 'SIP Modified',
        description: 'Your SIP plan has been modified successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to modify SIP',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for cancellation',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onCancel(plan.id, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      toast({
        title: 'SIP Cancelled',
        description: 'Your SIP plan has been cancelled successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel SIP',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage SIP Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Plan ID</p>
            <p className="font-medium">{plan.id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{plan.status}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Amount</p>
            <p className="font-medium">₹{plan.amount.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="font-medium">{plan.frequency}</p>
          </div>
          {plan.nextInstallmentDate && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Next Installment</p>
              <p className="font-medium">
                {format(new Date(plan.nextInstallmentDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="font-medium">
              {plan.completedInstallments} / {plan.installments}
            </p>
          </div>
        </div>

        {plan.pausedAt && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This SIP is currently paused since {format(new Date(plan.pausedAt), 'MMM dd, yyyy')}.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {canPause && (
            <Button
              variant="outline"
              onClick={() => setShowPauseDialog(true)}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause SIP
            </Button>
          )}

          {canResume && (
            <Button
              variant="outline"
              onClick={handleResume}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume SIP
            </Button>
          )}

          {canModify && (
            <Button
              variant="outline"
              onClick={() => {
                setModifyData({ newAmount: plan.amount, newFrequency: plan.frequency });
                setShowModifyDialog(true);
              }}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modify SIP
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel SIP
            </Button>
          )}
        </div>

        {/* Pause Dialog */}
        <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pause SIP Plan</DialogTitle>
              <DialogDescription>
                You can pause your SIP plan temporarily. Specify a date to resume automatically, or leave blank to pause indefinitely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pauseUntil">Resume Date (Optional)</Label>
                <Input
                  id="pauseUntil"
                  type="date"
                  value={pauseUntil}
                  onChange={(e) => setPauseUntil(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to pause indefinitely. You can resume manually anytime.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePause} disabled={isLoading}>
                Pause SIP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modify Dialog */}
        <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modify SIP Plan</DialogTitle>
              <DialogDescription>
                Update your SIP amount or frequency. Changes will take effect from the next installment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newAmount">New Amount (₹)</Label>
                <Input
                  id="newAmount"
                  type="number"
                  min="1000"
                  step="100"
                  value={modifyData.newAmount}
                  onChange={(e) =>
                    setModifyData({ ...modifyData, newAmount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newFrequency">New Frequency</Label>
                <Select
                  value={modifyData.newFrequency}
                  onValueChange={(value) =>
                    setModifyData({ ...modifyData, newFrequency: value as SIPFrequency })
                  }
                >
                  <SelectTrigger id="newFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleModify} disabled={isLoading}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel SIP Plan</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Please provide a reason for cancellation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cancelling this SIP will stop all future installments. This action is permanent.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Input
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep SIP Active
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
                Cancel SIP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

