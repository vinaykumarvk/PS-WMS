import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { AdviceFeedbackSummary, DashboardBriefing, DashboardBriefingMetric } from "@/types/dashboard";
import type { BriefingPreferences } from "@/context/preferences-context";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority?: string;
  valid_until?: string;
  created_at?: string;
}

interface TalkingPoint {
  id: number;
  title: string;
  summary: string;
  theme?: string;
  relevance_score?: number;
  created_at?: string;
  personalized_score?: number;
  auto_archived?: boolean;
}

interface AnalyticsSnapshot {
  generatedAt: string;
  metrics: Array<{ key: string; label: string; value: number; change: number; direction: "up" | "down" | "flat" }>;
  clientSummary: {
    totalClients: number;
    newClients: number;
    retentionRate: number;
  };
  revenueSummary: {
    totalRevenue: number;
    averageOrderValue: number;
    orderSuccessRate: number;
  };
  topClients: Array<{ clientId: number; clientName: string; totalValue: number; orderCount: number }>;
}

interface AdviceInteraction {
  id: number;
  action: string;
  recommendation: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
}

interface AdviceInteractionSummary {
  interactions: AdviceInteraction[];
  summary: AdviceFeedbackSummary;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

async function fetchBriefingInputs() {
  const [announcements, talkingPoints, analytics, adviceFeedback] = await Promise.all([
    fetch("/api/announcements").then((res) => res.json() as Promise<Announcement[]>),
    fetch("/api/talking-points").then((res) => res.json() as Promise<TalkingPoint[]>),
    fetch("/api/analytics/snapshots").then((res) => res.json() as Promise<AnalyticsSnapshot>),
    fetch("/api/ai-advice/interactions?limit=100").then((res) => res.json() as Promise<AdviceInteractionSummary>),
  ]);

  return { announcements, talkingPoints, analytics, adviceFeedback };
}

function formatMetric(metric: AnalyticsSnapshot["metrics"][number]): DashboardBriefingMetric {
  const value = metric.key === "orders"
    ? metric.value.toLocaleString("en-IN")
    : currencyFormatter.format(metric.value);

  const change = percentFormatter.format(metric.change / 100);
  const arrow = metric.direction === "up" ? "↑" : metric.direction === "down" ? "↓" : "→";

  return {
    label: metric.label,
    value,
    change: `${arrow} ${change}`,
    direction: metric.direction,
  };
}

function buildSummary(
  announcements: Announcement[],
  talkingPoints: TalkingPoint[],
  analytics: AnalyticsSnapshot,
  preferences: BriefingPreferences,
  adviceFeedback: AdviceInteractionSummary | undefined
): DashboardBriefing {
  const topAnnouncement = announcements?.[0];
  const latestTalkingPoint = talkingPoints?.find((point) => !point.auto_archived) ?? talkingPoints?.[0];
  const highlightCount = preferences.depth === "concise" ? 2 : preferences.depth === "standard" ? 3 : 4;
  const metrics = analytics.metrics.slice(0, 3).map(formatMetric);
  const topClient = analytics.topClients?.[0];

  const toneOpening = (() => {
    switch (preferences.tone) {
      case "friendly":
        return "Here's what's shaping your book today:";
      case "direct":
        return "Key signals:";
      default:
        return "Portfolio intelligence update:";
    }
  })();

  const aumMetric = analytics.metrics.find((metric) => metric.key === "aum");
  const revenueMetric = analytics.metrics.find((metric) => metric.key === "revenue");
  const orderMetric = analytics.metrics.find((metric) => metric.key === "orders");

  const summaryParts: string[] = [];

  if (aumMetric) {
    summaryParts.push(
      `AUM at ${currencyFormatter.format(aumMetric.value)} (${percentFormatter.format(aumMetric.change / 100)} vs prior period).`
    );
  }

  if (revenueMetric) {
    summaryParts.push(
      `Revenue ${revenueMetric.direction === "up" ? "is trending higher" : revenueMetric.direction === "down" ? "softened" : "is steady"} at ${currencyFormatter.format(revenueMetric.value)}.`
    );
  }

  if (orderMetric) {
    summaryParts.push(`Orders logged: ${orderMetric.value.toLocaleString("en-IN")} (${percentFormatter.format(orderMetric.change / 100)}).`);
  }

  const highlightCandidates: Array<{ title: string; detail: string }> = [];

  if (topAnnouncement) {
    const urgency = topAnnouncement.priority ? topAnnouncement.priority.replace(/_/g, " ") : "Update";
    const expiry = topAnnouncement.valid_until
      ? `Due ${formatDistanceToNow(new Date(topAnnouncement.valid_until), { addSuffix: true })}`
      : "Active";
    highlightCandidates.push({
      title: `Announcement • ${urgency}`,
      detail: `${topAnnouncement.title} (${expiry})`,
    });
  }

  if (latestTalkingPoint) {
    highlightCandidates.push({
      title: `Talking Point${latestTalkingPoint.theme ? ` • ${latestTalkingPoint.theme}` : ""}`,
      detail: latestTalkingPoint.summary || latestTalkingPoint.title,
    });
  }

  if (topClient) {
    highlightCandidates.push({
      title: "Client Momentum",
      detail: `${topClient.clientName}: ${currencyFormatter.format(topClient.totalValue)} across ${topClient.orderCount} orders`,
    });
  }

  highlightCandidates.push({
    title: "Retention",
    detail: `Retention at ${percentFormatter.format(analytics.clientSummary.retentionRate / 100)} with ${analytics.clientSummary.newClients.toLocaleString("en-IN")} new clients.`,
  });

  const nextBestActionsSource = [
    topAnnouncement ? `Action on ${topAnnouncement.title}` : undefined,
    topClient ? `Schedule a follow-up with ${topClient.clientName}` : undefined,
    analytics.clientSummary.retentionRate < 92 ? "Plan a retention touchpoint" : "Maintain momentum with proactive outreach",
  ].filter(Boolean) as string[];

  const dismissedSet = new Set(
    (adviceFeedback?.summary.repeatedDismissals ?? [])
      .filter((item) => item.count > 1)
      .map((item) => item.recommendation.toLowerCase())
  );

  const curatedActions = nextBestActionsSource.filter((action) => !dismissedSet.has(action.toLowerCase()));
  const nextBestActions = (curatedActions.length > 0 ? curatedActions : nextBestActionsSource).slice(0, highlightCount);
  const suppressedActions = nextBestActionsSource.filter((action) => dismissedSet.has(action.toLowerCase()));

  const adviceFeedbackSummary: AdviceFeedbackSummary | undefined = adviceFeedback
    ? {
        total: adviceFeedback.summary.total,
        accepted: adviceFeedback.summary.accepted,
        dismissed: adviceFeedback.summary.dismissed,
        adoptionRate: adviceFeedback.summary.adoptionRate,
        repeatedDismissals: adviceFeedback.summary.repeatedDismissals,
      }
    : undefined;

  if (adviceFeedbackSummary?.adoptionRate !== undefined && adviceFeedbackSummary.adoptionRate !== null) {
    summaryParts.push(
      `AI guidance adoption at ${percentFormatter.format((adviceFeedbackSummary.adoptionRate ?? 0) / 100)} ` +
      `(${adviceFeedbackSummary.accepted} accepted).`
    );
  }

  return {
    summary: `${toneOpening} ${summaryParts.join(" ")}`.trim(),
    highlights: highlightCandidates.slice(0, highlightCount),
    nextBestActions,
    metrics,
    generatedAt: analytics.generatedAt,
    tone: preferences.tone,
    depth: preferences.depth,
    adviceFeedback: adviceFeedbackSummary,
    suppressedActions: suppressedActions.length ? suppressedActions : undefined,
  };
}

async function generateDashboardBriefing(preferences: BriefingPreferences): Promise<DashboardBriefing> {
  const { announcements, talkingPoints, analytics, adviceFeedback } = await fetchBriefingInputs();
  return buildSummary(announcements ?? [], talkingPoints ?? [], analytics, preferences, adviceFeedback);
}

export function useDashboardBriefing(preferences: BriefingPreferences) {
  return useQuery<DashboardBriefing>({
    queryKey: ["dashboard", "briefing", preferences.tone, preferences.depth],
    queryFn: () => generateDashboardBriefing(preferences),
    staleTime: 90_000,
    refetchInterval: 180_000,
  });
}
