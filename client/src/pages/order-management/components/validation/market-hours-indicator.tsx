import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface MarketHoursData {
  isMarketOpen: boolean;
  isBeforeCutOff: boolean;
  marketHours: {
    open: string;
    close: string;
    cutOff: string;
  };
  minutesUntilCutOff: number | null;
  nextTradingDay: string;
  timezone: string;
}

interface MarketHoursIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function MarketHoursIndicator({
  className,
  showDetails = false,
  compact = false,
}: MarketHoursIndicatorProps) {
  const [marketData, setMarketData] = useState<MarketHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMarketHours = async () => {
      try {
        const response = await api.get<{ success: boolean; data: MarketHoursData }>(
          '/api/market-hours'
        );

        if (response.data.success) {
          setMarketData(response.data.data);
        } else {
          throw new Error('Failed to fetch market hours');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketHours();
    // Refresh every minute
    const interval = setInterval(fetchMarketHours, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        <Clock className="h-4 w-4 inline mr-1 animate-pulse" />
        Loading market status...
      </div>
    );
  }

  if (error || !marketData) {
    return null; // Silently fail
  }

  const { isMarketOpen, isBeforeCutOff, minutesUntilCutOff, marketHours, nextTradingDay } =
    marketData;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatMinutes = (mins: number | null) => {
    if (mins === null) return null;
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  if (compact) {
    return (
      <Badge
        variant={isMarketOpen ? 'default' : 'secondary'}
        className={cn('gap-1', className)}
      >
        {isMarketOpen ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            Market Open
            {minutesUntilCutOff !== null && minutesUntilCutOff > 0 && (
              <span className="ml-1">• {formatMinutes(minutesUntilCutOff)} to cutoff</span>
            )}
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3" />
            Market Closed
          </>
        )}
      </Badge>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMarketOpen ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {isMarketOpen ? 'Market is Open' : 'Market is Closed'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(marketHours.open)} - {formatTime(marketHours.close)} IST
              </div>
            </div>
          </div>
          {showDetails && (
            <div className="text-right text-xs text-muted-foreground">
              {isMarketOpen && minutesUntilCutOff !== null && minutesUntilCutOff > 0 && (
                <div className="font-medium text-amber-600">
                  Cut-off in {formatMinutes(minutesUntilCutOff)}
                </div>
              )}
              {!isMarketOpen && (
                <div>Next trading day: {new Date(nextTradingDay).toLocaleDateString()}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

