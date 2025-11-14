import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export interface Conflict {
  type: 'duplicate_order' | 'insufficient_balance' | 'limit_exceeded' | 'timing_conflict';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
}

interface ConflictDetectorProps {
  order: {
    fundId: string;
    amount: number;
    transactionType: 'purchase' | 'redemption' | 'switch';
    orderType?: 'lump_sum' | 'sip';
  };
  portfolioId?: string;
  onConflictsChange?: (conflicts: Conflict[]) => void;
  className?: string;
  autoCheck?: boolean;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    variant: 'destructive' as const,
    className: 'border-red-500 bg-red-50',
  },
  warning: {
    icon: AlertTriangle,
    variant: 'default' as const,
    className: 'border-amber-500 bg-amber-50',
  },
  info: {
    icon: Info,
    variant: 'default' as const,
    className: 'border-blue-500 bg-blue-50',
  },
};

export function ConflictDetector({
  order,
  portfolioId,
  onConflictsChange,
  className,
  autoCheck = true,
}: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set());

  const checkConflicts = async () => {
    if (!order.fundId || !order.amount) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{ success: boolean; data: Conflict[] }>(
        '/api/validation/check-conflicts',
        {
          portfolioId,
          order,
        }
      );

      if (response.data.success) {
        const filteredConflicts = response.data.data.filter(
          (c) => !dismissedConflicts.has(c.type)
        );
        setConflicts(filteredConflicts);
        if (onConflictsChange) {
          onConflictsChange(filteredConflicts);
        }
      } else {
        throw new Error('Failed to check conflicts');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoCheck && order.fundId && order.amount) {
      const timeoutId = setTimeout(() => {
        checkConflicts();
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [order.fundId, order.amount, order.transactionType, portfolioId, autoCheck]);

  const dismissConflict = (conflictType: string) => {
    setDismissedConflicts((prev) => new Set(prev).add(conflictType));
    setConflicts((prev) => prev.filter((c) => c.type !== conflictType));
    if (onConflictsChange) {
      onConflictsChange(conflicts.filter((c) => c.type !== conflictType));
    }
  };

  const visibleConflicts = conflicts.filter((c) => !dismissedConflicts.has(c.type));

  if (loading && conflicts.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Checking for conflicts...
      </div>
    );
  }

  if (error && conflicts.length === 0) {
    return null; // Silently fail
  }

  if (visibleConflicts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {visibleConflicts.map((conflict, index) => {
        const config = severityConfig[conflict.severity];
        const Icon = config.icon;

        return (
          <Alert key={`${conflict.type}-${index}`} variant={config.variant} className={cn(config.className)}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              {conflict.severity === 'error' && 'Error'}
              {conflict.severity === 'warning' && 'Warning'}
              {conflict.severity === 'info' && 'Info'}
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              <div className="flex items-start justify-between gap-2">
                <span>{conflict.message}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => dismissConflict(conflict.type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {conflict.details && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {Object.entries(conflict.details).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

