/**
 * Bulk Action Bar Component
 * Phase 4: Bulk Actions
 * 
 * Action bar that appears when items are selected for bulk operations
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, XCircle, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface BulkActionBarProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onBulkAction: (action: string, itemIds: string[], rescheduleDate?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function BulkActionBar({
  selectedItems,
  onClearSelection,
  onBulkAction,
  isLoading = false,
  className
}: BulkActionBarProps) {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  if (selectedItems.length === 0) {
    return null;
  }

  const handleAction = async (action: string) => {
    if (action === 'reschedule') {
      setShowRescheduleDialog(true);
      return;
    }

    await onBulkAction(action, selectedItems);
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      return;
    }

    await onBulkAction('reschedule', selectedItems, rescheduleDate);
    setShowRescheduleDialog(false);
    setRescheduleDate('');
  };

  const selectedCount = selectedItems.length;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 z-50 min-w-[400px]",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm font-medium">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleAction('complete')}
              disabled={isLoading}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('dismiss')}
              disabled={isLoading}
              className="h-8"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('reschedule')}
              disabled={isLoading}
              className="h-8"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAction('delete')}
              disabled={isLoading}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              disabled={isLoading}
              className="h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Items</DialogTitle>
            <DialogDescription>
              Select a new date for {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleDialog(false);
                setRescheduleDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || isLoading}
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

