import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, ListChecks } from "lucide-react";
import type { DashboardBriefing } from "@/types/dashboard";

interface GenerativeBriefingCardProps {
  briefing?: DashboardBriefing;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function GenerativeBriefingCard({ briefing, isLoading, onRefresh }: GenerativeBriefingCardProps) {
  return (
    <Card className="bg-card text-card-foreground border-unified transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sparkles size={18} />
          </span>
          <div>
            <CardTitle className="text-lg">AI Briefing</CardTitle>
            {briefing?.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw size={16} /> Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ) : briefing ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{briefing.summary}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highlights</h3>
                <ul className="space-y-2 text-sm">
                  {briefing.highlights.map((highlight, idx) => (
                    <li key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-2">
                      <div className="text-xs font-semibold text-muted-foreground">{highlight.title}</div>
                      <div className="text-sm text-foreground">{highlight.detail}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Best Actions</h3>
                <ol className="space-y-2 text-sm">
                  {briefing.nextBestActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span className="text-foreground">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks size={14} /> Momentum Metrics
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {briefing.metrics.map((metric, idx) => (
                  <div key={idx} className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                    <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                    {metric.change && (
                      <div className="text-xs text-muted-foreground">{metric.change}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No briefing available right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
