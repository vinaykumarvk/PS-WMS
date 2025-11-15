/**
 * Urgency Badge Component
 * Phase 2: Timeline View & Prioritization UI
 * 
 * Visual indicator for urgency levels (now, next, scheduled)
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, Calendar } from 'lucide-react';

export type UrgencyLevel = 'now' | 'next' | 'scheduled';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
  showIcon?: boolean;
}

const urgencyConfig = {
  now: {
    label: 'Now',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    icon: AlertCircle,
  },
  next: {
    label: 'Next',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    icon: Calendar,
  },
};

export function UrgencyBadge({ urgency, className, showIcon = true }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.label}</span>
    </Badge>
  );
}

