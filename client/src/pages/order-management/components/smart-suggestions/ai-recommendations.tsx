import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SuggestionList } from './suggestion-list';
import { useSmartSuggestions, SuggestionContext } from '../../hooks/use-smart-suggestions';
import { cn } from '@/lib/utils';

interface AIRecommendationsProps {
  context?: SuggestionContext;
  className?: string;
  onSuggestionApply?: (suggestion: any) => void;
  title?: string;
  description?: string;
}

export function AIRecommendations({
  context,
  className,
  onSuggestionApply,
  title = 'Smart Suggestions',
  description = 'AI-powered recommendations to optimize your investment decisions',
}: AIRecommendationsProps) {
  const { suggestions, loading, error, refreshSuggestions, dismissSuggestion, applySuggestion } =
    useSmartSuggestions({
      context,
      autoFetch: true,
      enabled: true,
    });

  const handleApply = (suggestion: any) => {
    const data = applySuggestion(suggestion);
    if (onSuggestionApply) {
      onSuggestionApply({ suggestion, data });
    }
  };

  const handleLearnMore = (suggestion: any) => {
    // Could open a modal or navigate to a help page
    console.log('Learn more about:', suggestion);
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSuggestions}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive mb-4">
            Failed to load suggestions. Please try again.
          </div>
        )}
        <SuggestionList
          suggestions={suggestions}
          loading={loading}
          onDismiss={dismissSuggestion}
          onApply={handleApply}
          onLearnMore={handleLearnMore}
          emptyMessage="No suggestions available. Your order looks good!"
        />
      </CardContent>
    </Card>
  );
}

