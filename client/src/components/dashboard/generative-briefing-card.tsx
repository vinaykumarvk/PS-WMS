import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, ListChecks, Check, X } from "lucide-react";
import type { DashboardBriefing } from "@/types/dashboard";

interface GenerativeBriefingCardProps {
  briefing?: DashboardBriefing;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function GenerativeBriefingCard({ briefing, isLoading, onRefresh }: GenerativeBriefingCardProps) {
  const { toast } = useToast();
  const [feedbackState, setFeedbackState] = useState<Record<string, "accepted" | "ignored">>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    setFeedbackState({});
    setSubmittingId(null);
  }, [briefing?.generatedAt]);

  const actions = useMemo(() => briefing?.nextBestActions ?? [], [briefing?.nextBestActions]);

  const makeAdviceId = useCallback(
    (action: string, index: number) => {
      const base = (briefing?.generatedAt ?? "briefing").replace(/[^a-zA-Z0-9]/g, "");
      const slug = action.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
      return `${base}-${index}-${slug}`;
    },
    [briefing?.generatedAt]
  );

  const handleFeedback = useCallback(
    async (adviceId: string, recommendation: string, index: number, action: "accepted" | "ignored") => {
      if (feedbackState[adviceId] === action || submittingId === adviceId) {
        return;
      }

      setSubmittingId(adviceId);
      try {
        const response = await fetch("/api/ai-advice/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adviceId,
            recommendation,
            action,
            metadata: {
              generatedAt: briefing?.generatedAt,
              rank: index,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setFeedbackState((prev) => ({ ...prev, [adviceId]: action }));
        toast({
          title: action === "accepted" ? "Added to daily plan" : "We'll dial this back",
          description:
            action === "accepted"
              ? "Great choice. Future briefings will prioritise similar plays."
              : "Got it. We'll down-rank comparable suggestions while retraining the model.",
        });

        onRefresh?.();
      } catch (error) {
        console.error("[GenerativeBriefing] Failed to send feedback", error);
        toast({
          title: "Unable to capture feedback",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setSubmittingId(null);
      }
    },
    [briefing?.generatedAt, feedbackState, onRefresh, submittingId, toast]
  );

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

            {briefing.adviceFeedback && (
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold text-foreground">
                  {briefing.adviceFeedback.adoptionRate !== null
                    ? `${briefing.adviceFeedback.adoptionRate}% AI guidance adoption`
                    : "No feedback captured yet"}
                </div>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>Accepted {briefing.adviceFeedback.accepted}</span>
                  <span>Ignored {briefing.adviceFeedback.dismissed}</span>
                </div>
              </div>
            )}

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
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <ListChecks size={14} /> Next Best Actions
                  </span>
                  {briefing.suppressedActions?.length ? (
                    <span className="text-[11px] text-muted-foreground">
                      Muted: {briefing.suppressedActions.join(", ")}
                    </span>
                  ) : null}
                </div>
                {actions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No guidance available right now.</p>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action, idx) => {
                      const adviceId = makeAdviceId(action, idx);
                      const currentStatus = feedbackState[adviceId];
                      return (
                        <div
                          key={adviceId}
                          className="rounded-lg border border-border/50 bg-background/70 p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm text-foreground">{action}</span>
                            {currentStatus && (
                              <Badge
                                variant={currentStatus === "accepted" ? "default" : "outline"}
                                className={
                                  currentStatus === "accepted"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {currentStatus === "accepted" ? "Accepted" : "Ignored"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleFeedback(adviceId, action, idx, "accepted")}
                              disabled={submittingId === adviceId || currentStatus === "accepted"}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFeedback(adviceId, action, idx, "ignored")}
                              disabled={submittingId === adviceId || currentStatus === "ignored"}
                              className="flex items-center gap-1"
                            >
                              <X className="h-4 w-4" /> Ignore
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
