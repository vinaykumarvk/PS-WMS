import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suggestion } from '../../hooks/use-smart-suggestions';
import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onDismiss?: (id: string) => void;
  onApply?: (suggestion: Suggestion) => void;
  onLearnMore?: (suggestion: Suggestion) => void;
  className?: string;
}

const priorityConfig = {
  high: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  low: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

const typeLabels = {
  fund_recommendation: 'Fund Recommendation',
  amount_optimization: 'Amount Optimization',
  timing_suggestion: 'Timing Suggestion',
  portfolio_rebalancing: 'Portfolio Rebalancing',
};

export function SuggestionCard({
  suggestion,
  onDismiss,
  onApply,
  onLearnMore,
  className,
}: SuggestionCardProps) {
  const config = priorityConfig[suggestion.priority];
  const Icon = config.icon;

  const handleAction = () => {
    if (suggestion.action?.type === 'apply' && onApply) {
      onApply(suggestion);
    } else if (suggestion.action?.type === 'learn_more' && onLearnMore) {
      onLearnMore(suggestion);
    }
  };

  return (
    <Card
      className={cn(
        'relative transition-all hover:shadow-md',
        config.bgColor,
        config.borderColor,
        'border-l-4',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn('mt-1 h-5 w-5', config.color)} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-sm font-semibold">{suggestion.title}</CardTitle>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/60">
                  {typeLabels[suggestion.type]}
                </span>
              </div>
              <CardDescription className="text-sm mt-1">
                {suggestion.description}
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onDismiss(suggestion.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {suggestion.action && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Button
              variant={suggestion.action.type === 'apply' ? 'default' : 'outline'}
              size="sm"
              onClick={handleAction}
              className="text-xs"
            >
              {suggestion.action.type === 'apply' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {suggestion.action.type === 'learn_more' && <ExternalLink className="h-3 w-3 mr-1" />}
              {suggestion.action.label}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

