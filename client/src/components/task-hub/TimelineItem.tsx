/**
 * Timeline Item Component
 * Phase 2: Timeline View & Prioritization UI
 * 
 * Unified item card for tasks, alerts, and appointments
 */

import { useState, memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UrgencyBadge } from './UrgencyBadge';
import { UnifiedItem } from '@/hooks/useTaskHub';
import { 
  CheckCircle, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
  item: UnifiedItem;
  onComplete?: (item: UnifiedItem) => void;
  onDismiss?: (item: UnifiedItem) => void;
  onSchedule?: (item: UnifiedItem) => void;
  isLoading?: boolean;
  selected?: boolean;
  onSelect?: (item: UnifiedItem, selected: boolean) => void;
  showCheckbox?: boolean;
}

export const TimelineItem = memo(function TimelineItem({ 
  item, 
  onComplete, 
  onDismiss,
  onSchedule,
  isLoading,
  selected = false,
  onSelect,
  showCheckbox = false
}: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getIconColor = () => {
    switch (item.type) {
      case 'task':
        return item.completed 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-blue-600 dark:text-blue-400';
      case 'alert':
        return item.severity === 'critical'
          ? 'text-red-600 dark:text-red-400'
          : item.severity === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-blue-600 dark:text-blue-400';
      case 'appointment':
        return 'text-purple-600 dark:text-purple-400';
    }
  };

  const getQuickActionLabel = () => {
    if (item.type === 'task' && !item.completed) {
      return 'Complete';
    } else if (item.type === 'alert' && !item.read) {
      return 'Dismiss';
    }
    return null;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return null;
    }
  };

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(item, !selected);
    }
  }, [onSelect, item, selected]);

  const handleCardClick = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleQuickAction = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'task' && onComplete) {
      onComplete(item);
    } else if (item.type === 'alert' && onDismiss) {
      onDismiss(item);
    }
  }, [item, onComplete, onDismiss]);

  const handleScheduleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSchedule) {
      onSchedule(item);
    }
  }, [onSchedule, item]);

  // Memoize computed values
  const icon = useMemo(() => getIcon(), [item.type]);
  const iconColor = useMemo(() => getIconColor(), [item.type, item.severity, item.completed]);
  const quickActionLabel = useMemo(() => getQuickActionLabel(), [item.type, item.completed, item.read]);
  const formattedDate = useMemo(() => formatDateTime(item.dueDate || item.scheduledFor), [item.dueDate, item.scheduledFor]);

  return (
    <Card 
      className={cn(
        "p-3 hover:shadow-md transition-all duration-200 cursor-pointer",
        item.type === 'alert' && item.severity === 'critical' && !item.read && "border-l-4 border-l-red-500",
        item.type === 'task' && item.completed && "opacity-60",
        selected && "ring-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for bulk selection */}
        {showCheckbox && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => {
              if (onSelect) {
                onSelect(item, !!checked);
              }
            }}
            onClick={handleCheckboxClick}
            className="mt-0.5"
          />
        )}
        
        {/* Icon */}
        <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-sm font-medium truncate",
                item.type === 'task' && item.completed && "line-through text-muted-foreground",
                item.type === 'alert' && item.read && "text-muted-foreground"
              )}>
                {item.title}
              </h4>
              {!expanded && item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <UrgencyBadge urgency={item.urgency} />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-3 space-y-3 pt-3 border-t border-border/50">
              {/* Description */}
              {item.description && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </h5>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-col gap-2">
                {item.dueDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Due: {formatDate(item.dueDate)}
                    </span>
                  </div>
                )}
                {item.scheduledFor && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Scheduled: {formattedDate || formatDateTime(item.scheduledFor)}
                    </span>
                  </div>
                )}
                {item.type === 'appointment' && item.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Starts: {formattedDate || formatDateTime(item.dueDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Client/Prospect */}
              {(item.clientName || item.prospectName) && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {item.clientName || item.prospectName}
                  </span>
                </div>
              )}

              {/* Priority/Severity */}
              {(item.priority || item.severity) && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {item.type === 'alert' ? 'Severity' : 'Priority'}:{' '}
                  </span>
                  <span className="text-xs text-foreground capitalize">
                    {item.severity || item.priority}
                  </span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {item.type === 'task' && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      item.completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    )}>
                      {item.completed ? 'Completed' : 'Pending'}
                    </span>
                  )}
                  {item.type === 'alert' && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      item.read
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    )}>
                      {item.read ? 'Read' : 'Unread'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onSchedule && (item.type === 'task' || item.type === 'alert') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScheduleClick}
                      disabled={isLoading}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  )}
                  {quickActionLabel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickAction}
                      disabled={isLoading}
                    >
                      {quickActionLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - only re-render if these props change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.completed === nextProps.item.completed &&
    prevProps.item.read === nextProps.item.read &&
    prevProps.selected === nextProps.selected &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.showCheckbox === nextProps.showCheckbox &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.urgency === nextProps.item.urgency
  );
});

