/**
 * Timeline View Component
 * Phase 2: Timeline View & Prioritization UI
 * 
 * Three-column layout displaying items by urgency (Now, Next, Scheduled)
 */

import React, { useState, useMemo, memo } from 'react';
import { useTaskHub, UnifiedFeedFilters, UnifiedItem } from '@/hooks/useTaskHub';
import { TimelineItem } from './TimelineItem';
import { BulkActionBar } from './BulkActionBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Calendar, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TimelineViewProps {
  filters?: UnifiedFeedFilters;
  className?: string;
  items?: { now: UnifiedItem[], next: UnifiedItem[], scheduled: UnifiedItem[] };
  showBulkActions?: boolean;
  onScheduleItem?: (item: UnifiedItem) => void;
}

const TimelineColumn = memo(function TimelineColumn({ 
  title, 
  items, 
  icon: Icon, 
  emptyMessage,
  renderItem,
  selectedItems,
  onSelectAll
}: { 
  title: string; 
  items: UnifiedItem[]; 
  icon: any;
  emptyMessage: string;
  renderItem: (item: UnifiedItem) => React.ReactNode;
  selectedItems: Set<string>;
  onSelectAll?: (items: UnifiedItem[], select: boolean) => void;
}) {
  const allSelected = useMemo(() => 
    items.length > 0 && items.every(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );
  const someSelected = useMemo(() => 
    items.some(item => selectedItems.has(item.id)),
    [items, selectedItems]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {title}
          </h3>
          <span className="text-sm text-muted-foreground">
            ({items.length})
          </span>
        </div>
        {items.length > 0 && onSelectAll && (
          <button
            onClick={() => onSelectAll(items, !allSelected)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => renderItem(item))}
        </div>
      )}
    </div>
  );
});

function TimelineSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-6 w-32 mb-4" />
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TimelineView({ 
  filters, 
  className, 
  items: overrideItems,
  showBulkActions = true,
  onScheduleItem
}: TimelineViewProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { 
    nowItems: defaultNowItems, 
    nextItems: defaultNextItems, 
    scheduledItems: defaultScheduledItems, 
    isLoading, 
    error,
    completeTask,
    dismissAlert,
    isCompletingTask,
    isDismissingAlert
  } = useTaskHub(filters);

  // Use override items if provided (for search filtering)
  const nowItems = overrideItems?.now || defaultNowItems;
  const nextItems = overrideItems?.next || defaultNextItems;
  const scheduledItems = overrideItems?.scheduled || defaultScheduledItems;

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, itemIds, rescheduleDate }: { 
      action: string; 
      itemIds: string[];
      rescheduleDate?: string;
    }) => {
      const body: any = { itemIds, action };
      if (rescheduleDate) {
        body.rescheduleDate = rescheduleDate;
      }
      const response = await apiRequest('POST', '/api/task-hub/bulk', body);
      if (!response.ok) {
        throw new Error('Bulk operation failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const { summary } = data;
      toast({
        title: 'Bulk operation completed',
        description: `${summary.succeeded} succeeded, ${summary.failed} failed`,
      });
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-alerts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Bulk operation failed',
        variant: 'destructive',
      });
    },
  });

  const handleItemSelect = (item: UnifiedItem, selected: boolean) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });
  };

  const handleSelectAll = (items: UnifiedItem[], select: boolean) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (select) {
        items.forEach(item => next.add(item.id));
      } else {
        items.forEach(item => next.delete(item.id));
      }
      return next;
    });
  };

  const handleBulkAction = async (action: string, itemIds: string[], rescheduleDate?: string) => {
    await bulkActionMutation.mutateAsync({ action, itemIds, rescheduleDate });
  };

  if (error) {
    return (
      <Card className={cn("p-8", className)}>
        <CardContent className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-2" />
          <h3 className="text-lg font-semibold mb-1">Error loading timeline</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  const handleComplete = (item: any) => {
    if (item.type === 'task') {
      completeTask(item.originalId);
    }
  };

  const handleDismiss = (item: any) => {
    if (item.type === 'alert') {
      dismissAlert(item.originalId);
    }
  };

  const handleSchedule = (item: UnifiedItem) => {
    // This will be handled by parent component (TaskHubView)
    // TimelineView doesn't need to handle scheduling directly
  };

  return (
    <>
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
        {/* Now Column */}
        <TimelineColumn
          title="Now"
          items={nowItems}
          icon={AlertCircle}
          emptyMessage="No urgent items"
          selectedItems={selectedItems}
          onSelectAll={showBulkActions ? handleSelectAll : undefined}
          renderItem={(item) => (
            <TimelineItem
              key={item.id}
              item={item}
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSchedule={onScheduleItem}
              isLoading={isCompletingTask || isDismissingAlert}
              selected={selectedItems.has(item.id)}
              onSelect={showBulkActions ? handleItemSelect : undefined}
              showCheckbox={showBulkActions}
            />
          )}
        />

        {/* Next Column */}
        <TimelineColumn
          title="Next"
          items={nextItems}
          icon={Clock}
          emptyMessage="No upcoming items"
          selectedItems={selectedItems}
          onSelectAll={showBulkActions ? handleSelectAll : undefined}
          renderItem={(item) => (
            <TimelineItem
              key={item.id}
              item={item}
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSchedule={onScheduleItem}
              isLoading={isCompletingTask || isDismissingAlert}
              selected={selectedItems.has(item.id)}
              onSelect={showBulkActions ? handleItemSelect : undefined}
              showCheckbox={showBulkActions}
            />
          )}
        />

        {/* Scheduled Column */}
        <TimelineColumn
          title="Scheduled"
          items={scheduledItems}
          icon={Calendar}
          emptyMessage="No scheduled items"
          selectedItems={selectedItems}
          onSelectAll={showBulkActions ? handleSelectAll : undefined}
          renderItem={(item) => (
            <TimelineItem
              key={item.id}
              item={item}
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSchedule={onScheduleItem}
              isLoading={isCompletingTask || isDismissingAlert}
              selected={selectedItems.has(item.id)}
              onSelect={showBulkActions ? handleItemSelect : undefined}
              showCheckbox={showBulkActions}
            />
          )}
        />
      </div>

      {/* Bulk Action Bar */}
      {showBulkActions && (
        <BulkActionBar
          selectedItems={Array.from(selectedItems)}
          onClearSelection={() => setSelectedItems(new Set())}
          onBulkAction={handleBulkAction}
          isLoading={bulkActionMutation.isPending}
        />
      )}
    </>
  );
}

