import { SuggestionCard } from './suggestion-card';
import { Suggestion } from '../../hooks/use-smart-suggestions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SuggestionListProps {
  suggestions: Suggestion[];
  loading?: boolean;
  onDismiss?: (id: string) => void;
  onApply?: (suggestion: Suggestion) => void;
  onLearnMore?: (suggestion: Suggestion) => void;
  className?: string;
  emptyMessage?: string;
}

export function SuggestionList({
  suggestions,
  loading = false,
  onDismiss,
  onApply,
  onLearnMore,
  className,
  emptyMessage = 'No suggestions available at this time.',
}: SuggestionListProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading suggestions...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn('text-center py-8 text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  // Group suggestions by priority
  const highPriority = suggestions.filter((s) => s.priority === 'high');
  const mediumPriority = suggestions.filter((s) => s.priority === 'medium');
  const lowPriority = suggestions.filter((s) => s.priority === 'low');

  return (
    <div className={cn('space-y-3', className)}>
      {highPriority.length > 0 && (
        <div className="space-y-2">
          {highPriority.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={onDismiss}
              onApply={onApply}
              onLearnMore={onLearnMore}
            />
          ))}
        </div>
      )}

      {mediumPriority.length > 0 && (
        <div className="space-y-2">
          {mediumPriority.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={onDismiss}
              onApply={onApply}
              onLearnMore={onLearnMore}
            />
          ))}
        </div>
      )}

      {lowPriority.length > 0 && (
        <div className="space-y-2">
          {lowPriority.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={onDismiss}
              onApply={onApply}
              onLearnMore={onLearnMore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

