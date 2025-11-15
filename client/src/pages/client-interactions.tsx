import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PhoneCall, Calendar, Mail, Clock, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clientApi } from "@/lib/api";
import { formatRelativeDate } from "@/lib/utils";

interface InteractionSummaryResponse {
  clientId: number | null;
  totalInteractions: number;
  interactions: Array<{
    id: number;
    client_id: number;
    start_time: string;
    end_time: string | null;
    duration: number | null;
    communication_type: string;
    channel: string | null;
    direction: string;
    subject: string | null;
    summary: string | null;
    notes: string | null;
    sentiment: string | null;
    follow_up_required: boolean | null;
    follow_up_date?: string | null;
    tags: string[];
    status: string | null;
  }>;
  summary: {
    byType: Record<string, number>;
    byChannel: Record<string, number>;
    sentiment: Record<string, number>;
    averageDuration: number | null;
    followUps: number;
  };
  topTags: Array<{ tag: string; count: number }>;
  lastInteraction: InteractionSummaryResponse["interactions"][number] | null;
  recommendation: {
    day: string;
    window: string;
    confidence: number;
    supportingInteractions: number;
    lastSuccessfulInteraction: string | null;
  } | null;
}

export default function ClientInteractionsPage() {
  const [clientId, setClientId] = useState<number | null>(null);

  // Set page title
  useEffect(() => {
    document.title = "Client Interactions | Wealth RM";

    // Get client ID from URL
    const hash = window.location.hash;
    const match = hash.match(/\/clients\/(\d+)\/interactions/);
    if (match && match[1]) {
      setClientId(Number(match[1]));
    }
  }, []);

  // Fetch client data
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? clientApi.getClient(clientId) : null,
    enabled: !!clientId,
  });

  
  const { data: interactionSummary, isLoading: interactionsLoading } = useQuery<InteractionSummaryResponse | null>({
    queryKey: ['/api/interactions', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await fetch(`/api/interactions?clientId=${clientId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load interaction summary');
      }
      return response.json();
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });

  const handleBackClick = () => {
    window.location.hash = "/clients";
  };

  const lastInteraction = interactionSummary?.lastInteraction;
  const lastInteractionDate = lastInteraction?.start_time ? formatRelativeDate(new Date(lastInteraction.start_time)) : "N/A";
  const lastInteractionChannel = lastInteraction?.channel || lastInteraction?.communication_type || "N/A";

  const summary = interactionSummary?.summary;

  const dominantChannel = useMemo(() => {
    if (!summary?.byChannel) return null;
    const entries = Object.entries(summary.byChannel);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [summary?.byChannel]);

  const recommendedMeeting = interactionSummary?.recommendation;
  const recentInteractions = interactionSummary?.interactions?.slice(0, 5) ?? [];

  const getInteractionVisuals = (interactionType: string | null | undefined) => {
    const normalized = (interactionType || '').toLowerCase();
    if (normalized.includes('call')) {
      return { color: 'border-blue-500', icon: PhoneCall };
    }
    if (normalized.includes('meet') || normalized.includes('review')) {
      return { color: 'border-green-500', icon: Calendar };
    }
    if (normalized.includes('email') || normalized.includes('mail')) {
      return { color: 'border-purple-500', icon: Mail };
    }
    return { color: 'border-muted', icon: Clock };
  };

  
  if (!clientId) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 lg:py-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Client not found</h1>
        <Button onClick={handleBackClick}>Back to Clients</Button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 lg:py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            `${client?.fullName}'s Interactions`
          )}
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-medium">Interaction Summary</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <PhoneCall className="h-4 w-4" />
                Log Call
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Contact</span>
                  <span className="font-medium">
                    {isLoading || interactionsLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      lastInteractionDate
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Primary Channel</span>
                  <span className="font-medium capitalize">
                    {interactionsLoading ? (
                      <Skeleton className="h-4 w-20" />
                    ) : (
                      dominantChannel ? dominantChannel : lastInteractionChannel
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Interactions (90d)</span>
                  <span className="font-medium">
                    {interactionsLoading ? (
                      <Skeleton className="h-4 w-12" />
                    ) : (
                      interactionSummary?.totalInteractions ?? 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg. Duration</span>
                  <span className="font-medium">
                    {interactionsLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      summary?.averageDuration ? `${summary.averageDuration} mins` : '—'
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Recommended meeting window
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {interactionsLoading ? (
                    <>
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-4 w-56" />
                    </>
                  ) : recommendedMeeting ? (
                    <>
                      <div className="text-base font-semibold">
                        {recommendedMeeting.day} • {recommendedMeeting.window}
                      </div>
                      <p className="text-muted-foreground">
                        Based on {recommendedMeeting.supportingInteractions} successful touchpoints. Confidence {Math.round((recommendedMeeting.confidence || 0) * 100)}%.
                      </p>
                      {recommendedMeeting.lastSuccessfulInteraction && (
                        <p className="text-muted-foreground text-xs">
                          Last success {formatRelativeDate(new Date(recommendedMeeting.lastSuccessfulInteraction))}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Not enough recent activity to recommend an optimal meeting window yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Top conversation tags
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interactionsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-7 w-16" />
                    ))
                  ) : interactionSummary?.topTags && interactionSummary.topTags.length > 0 ? (
                    interactionSummary.topTags.map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                        <span className="ml-1 text-muted-foreground">×{count}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No tags captured yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Follow-ups pending</span>
                  <span className="font-medium">
                    {interactionsLoading ? (
                      <Skeleton className="h-4 w-12" />
                    ) : (
                      summary?.followUps ?? 0
                    )}
                  </span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Ensure follow-up commitments are captured in the CRM and scheduled promptly to maintain momentum.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Recent Interactions</h2>
          <div className="space-y-4">
            {interactionsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border-l-4 border-muted pl-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : recentInteractions.length > 0 ? (
              recentInteractions.map((interaction) => {
                const visuals = getInteractionVisuals(interaction.communication_type);
                const Icon = visuals.icon;

                return (
                  <div key={interaction.id} className={`border-l-4 ${visuals.color} pl-4 py-3`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {interaction.subject || interaction.communication_type || 'Interaction'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {interaction.summary || interaction.notes || 'No summary recorded.'}
                        </p>
                        {interaction.tags && interaction.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {interaction.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 text-muted-foreground text-xs">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{formatRelativeDate(new Date(interaction.start_time))}</span>
                        </div>
                        {interaction.sentiment && (
                          <span className="capitalize">{interaction.sentiment}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No interactions recorded for this client yet. Log a touchpoint to build engagement insights.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Engagement signal breakdown</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sentiment</h3>
              <div className="space-y-2 text-sm">
                {interactionsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-4 w-40" />
                  ))
                ) : summary ? (
                  Object.entries(summary.sentiment ?? {}).map(([sentiment, count]) => (
                    <div key={sentiment} className="flex items-center justify-between">
                      <span className="capitalize">{sentiment}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No sentiment data captured yet.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Touchpoints by channel</h3>
              <div className="space-y-2 text-sm">
                {interactionsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-4 w-48" />
                  ))
                ) : summary ? (
                  Object.entries(summary.byChannel ?? {}).map(([channel, count]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <span className="capitalize">{channel}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Channel engagement not available.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
