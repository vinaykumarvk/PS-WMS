/**
 * Notification Preferences Component
 * Module 11.4: Smart Notifications
 */

import React, { useState } from 'react';
import { Plus, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotificationPreferences } from '../hooks/use-automation';
import type { NotificationPreference, CreateNotificationPreferenceInput, NotificationEvent, NotificationChannel } from '@shared/types/automation.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface NotificationPreferencesProps {
  clientId: number;
}

export default function NotificationPreferences({ clientId }: NotificationPreferencesProps) {
  const { preferences, isLoading, createPreference, updatePreference, deletePreference } = useNotificationPreferences(clientId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreate = async (data: CreateNotificationPreferenceInput) => {
    await createPreference.mutateAsync(data);
    setShowCreateDialog(false);
  };

  const handleToggle = async (pref: NotificationPreference) => {
    await updatePreference.mutateAsync({
      prefId: pref.id,
      updates: { enabled: !pref.enabled },
    });
  };

  const handleDelete = async (prefId: string) => {
    if (confirm('Are you sure you want to delete this notification preference?')) {
      await deletePreference.mutateAsync(prefId);
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'Email':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'Push':
        return <Smartphone className="h-4 w-4" />;
      case 'In-App':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading notification preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Configure how and when you receive notifications
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Preference
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Notification Preference</DialogTitle>
              <DialogDescription>
                Set up notification preferences for specific events
              </DialogDescription>
            </DialogHeader>
            <NotificationPreferenceForm
              clientId={clientId}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {preferences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No notification preferences yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Preference
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {preferences.map((pref) => (
            <Card key={pref.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      {pref.event}
                      <Badge variant={pref.enabled ? 'default' : 'secondary'}>
                        {pref.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Notification channels: {pref.channels.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Switch
                      checked={pref.enabled}
                      onCheckedChange={() => handleToggle(pref)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pref.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Channels:</span>
                    <div className="flex gap-2">
                      {pref.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="flex items-center gap-1">
                          {getChannelIcon(channel)}
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {pref.quietHours && (
                    <div className="text-sm text-muted-foreground">
                      Quiet Hours: {pref.quietHours.start} - {pref.quietHours.end}
                    </div>
                  )}
                  {pref.minAmount && (
                    <div className="text-sm text-muted-foreground">
                      Minimum Amount: ₹{pref.minAmount.toLocaleString()}
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

interface NotificationPreferenceFormProps {
  clientId: number;
  onSubmit: (data: CreateNotificationPreferenceInput) => void;
  onCancel: () => void;
}

function NotificationPreferenceForm({ clientId, onSubmit, onCancel }: NotificationPreferenceFormProps) {
  const [formData, setFormData] = useState<Partial<CreateNotificationPreferenceInput>>({
    clientId,
    event: 'Order Executed',
    channels: ['Email'],
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.event && formData.channels && formData.channels.length > 0) {
      onSubmit(formData as CreateNotificationPreferenceInput);
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    const channels = formData.channels || [];
    if (channels.includes(channel)) {
      setFormData({ ...formData, channels: channels.filter((c) => c !== channel) });
    } else {
      setFormData({ ...formData, channels: [...channels, channel] });
    }
  };

  const events: NotificationEvent[] = [
    'Order Submitted',
    'Order Executed',
    'Order Failed',
    'Order Settled',
    'Auto-Invest Executed',
    'Auto-Invest Failed',
    'Rebalancing Triggered',
    'Rebalancing Executed',
    'Trigger Order Activated',
    'Goal Milestone Reached',
    'Portfolio Alert',
    'Market Update',
  ];

  const channels: NotificationChannel[] = ['Email', 'SMS', 'Push', 'In-App'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="event">Event *</Label>
        <Select
          value={formData.event}
          onValueChange={(value) => setFormData({ ...formData, event: value as NotificationEvent })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Channels *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {channels.map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <Checkbox
                id={channel}
                checked={formData.channels?.includes(channel)}
                onCheckedChange={() => toggleChannel(channel)}
              />
              <Label htmlFor={channel} className="cursor-pointer">
                {channel}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="enabled">Enabled</Label>
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Preference</Button>
      </div>
    </form>
  );
}

