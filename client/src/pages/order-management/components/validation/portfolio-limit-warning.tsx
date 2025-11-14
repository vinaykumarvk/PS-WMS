import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export interface PortfolioLimit {
  type: 'single_fund_limit' | 'category_limit' | 'total_portfolio_limit';
  current: number;
  limit: number;
  percentage: number;
  message: string;
}

interface PortfolioLimitWarningProps {
  portfolioId: string;
  newOrderAmount: number;
  fundId: string;
  onLimitsChange?: (limits: PortfolioLimit[]) => void;
  className?: string;
  autoCheck?: boolean;
}

const limitTypeLabels = {
  single_fund_limit: 'Single Fund Limit',
  category_limit: 'Category Limit',
  total_portfolio_limit: 'Total Portfolio Limit',
};

export function PortfolioLimitWarning({
  portfolioId,
  newOrderAmount,
  fundId,
  onLimitsChange,
  className,
  autoCheck = true,
}: PortfolioLimitWarningProps) {
  const [limits, setLimits] = useState<PortfolioLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkLimits = async () => {
    if (!portfolioId || !newOrderAmount || !fundId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{ success: boolean; data: PortfolioLimit[] }>(
        '/api/validation/portfolio-limits',
        {
          portfolioId,
          newOrderAmount,
          fundId,
        }
      );

      if (response.data.success) {
        setLimits(response.data.data);
        if (onLimitsChange) {
          onLimitsChange(response.data.data);
        }
      } else {
        throw new Error('Failed to check portfolio limits');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLimits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoCheck && portfolioId && newOrderAmount > 0 && fundId) {
      const timeoutId = setTimeout(() => {
        checkLimits();
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [portfolioId, newOrderAmount, fundId, autoCheck]);

  if (loading && limits.length === 0) {
    return null; // Don't show loading state
  }

  if (error || limits.length === 0) {
    return null; // Silently fail or no limits exceeded
  }

  return (
    <div className={cn('space-y-3', className)}>
      {limits.map((limit, index) => {
        const isExceeded = limit.percentage > 100;
        const isWarning = limit.percentage > 80 && limit.percentage <= 100;

        return (
          <Alert
            key={`${limit.type}-${index}`}
            variant={isExceeded ? 'destructive' : 'default'}
            className={cn(
              isExceeded && 'border-red-500 bg-red-50',
              isWarning && 'border-amber-500 bg-amber-50'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              {limitTypeLabels[limit.type]}
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              <div className="space-y-2">
                <p>{limit.message}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Current: ₹{limit.current.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Limit: ₹{limit.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(limit.percentage, 100)}
                    className={cn(
                      'h-2',
                      isExceeded && 'bg-red-200',
                      isWarning && 'bg-amber-200'
                    )}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {limit.percentage.toFixed(1)}% of limit
                    </span>
                    {isExceeded && (
                      <span className="text-red-600 font-medium">
                        Exceeded by {((limit.percentage - 100) * limit.limit / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

