import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionRecommendation } from '../types/analytics.types';
import { BrainCircuit, Sparkles } from 'lucide-react';

interface AnalyticsRecommendationsProps {
  recommendations: ActionRecommendation[];
  isLoading: boolean;
}

export function AnalyticsRecommendations({ recommendations, isLoading }: AnalyticsRecommendationsProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Intelligent guidance
          </CardTitle>
          <CardDescription>Evaluating KPI posture…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          KPI opportunity engine
        </CardTitle>
        <CardDescription>
          Recommendations blended from rule-based heuristics and simulated ML inference. Focus on the top actions near your current filters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All monitored KPIs are within guardrails. Adjust filters for deeper diagnostics.
          </p>
        ) : (
          recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded-lg border border-dashed border-muted-foreground/40 bg-background/80 p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{recommendation.title}</p>
                  <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                </div>
                <Badge className="bg-primary/10 text-primary">
                  {recommendation.confidence}% confidence
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {recommendation.category}
                </Badge>
                {recommendation.evidence.map((item, index) => (
                  <span
                    key={`${recommendation.id}-evidence-${index}`}
                    className="rounded-full border border-muted-foreground/40 bg-background px-3 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
