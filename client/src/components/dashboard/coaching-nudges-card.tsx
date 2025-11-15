import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Users,
  Target,
  ListChecks,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import {
  calculateRelationshipHealth,
  summarizeRelationshipHealth,
  type RelationshipHealthRecord,
} from "@/utils/relationship-health";

type NudgeTone = "positive" | "neutral" | "caution" | "critical";

interface CoachingNudge {
  goal: string;
  headline: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  tone: NudgeTone;
  icon: React.ReactNode;
}

interface CoachingNudgesCardProps {
  className?: string;
}

const TONE_STYLES: Record<NudgeTone, { border: string; background: string; badge: string; icon: string }> = {
  positive: {
    border: "border-emerald-500/30",
    background: "bg-emerald-500/5",
    badge: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-500",
  },
  neutral: {
    border: "border-border/60",
    background: "bg-muted/30",
    badge: "border-border text-muted-foreground",
    icon: "text-muted-foreground",
  },
  caution: {
    border: "border-amber-500/40",
    background: "bg-amber-500/10",
    badge: "border-amber-500 text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  critical: {
    border: "border-red-500/40",
    background: "bg-red-500/10",
    badge: "border-red-500 text-red-600 dark:text-red-400",
    icon: "text-red-500",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrencyCompact(amount: number): string {
  if (!amount) return "₹0";
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return currencyFormatter.format(amount);
}

export function CoachingNudgesCard({ className }: CoachingNudgesCardProps) {
  const [, navigate] = useLocation();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => fetch('/api/tasks').then((res) => res.json()),
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/appointments'],
    queryFn: () => fetch('/api/appointments').then((res) => res.json()),
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: ['/api/portfolio-alerts'],
    queryFn: () => fetch('/api/portfolio-alerts').then((res) => res.json()),
  });

  const { data: performance, isLoading: performanceLoading } = useQuery<any>({
    queryKey: ['/api/performance'],
    queryFn: () => fetch('/api/performance').then((res) => res.json()),
  });

  const { data: prospects = [], isLoading: prospectsLoading } = useQuery<any[]>({
    queryKey: ['/api/prospects'],
    queryFn: () => fetch('/api/prospects').then((res) => res.json()),
  });

  const { data: talkingPoints = [], isLoading: talkingPointsLoading } = useQuery<any[]>({
    queryKey: ['/api/talking-points'],
    queryFn: () => fetch('/api/talking-points').then((res) => res.json()),
  });

  const isLoading =
    clientsLoading ||
    tasksLoading ||
    appointmentsLoading ||
    alertsLoading ||
    performanceLoading ||
    prospectsLoading ||
    talkingPointsLoading;

  const healthRecords = useMemo<RelationshipHealthRecord[]>(() => {
    return clients.map((client: any) =>
      calculateRelationshipHealth(client, { tasks, appointments, alerts })
    );
  }, [clients, tasks, appointments, alerts]);

  const healthSummary = useMemo(() => summarizeRelationshipHealth(healthRecords), [healthRecords]);

  const atRiskClients = useMemo(() => healthSummary.atRiskClients.slice(0, 3), [healthSummary]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task: any) => {
      if (task.completed) return false;
      const due = task.dueDate ?? task.due_date;
      if (!due) return false;
      const dueDate = new Date(due);
      return dueDate < now;
    }).length;
  }, [tasks]);

  const highPriorityTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (task.completed) return false;
      const priority = (task.priority ?? "").toString().toLowerCase();
      return priority === "high" || priority === "urgent";
    }).length;
  }, [tasks]);

  const activeProspects = useMemo(() => {
    return prospects.filter((prospect: any) =>
      ["new", "qualified", "proposal"].includes((prospect.stage ?? prospect.stage)?.toLowerCase())
    );
  }, [prospects]);

  const pipelineTarget = performance?.targets?.find((target: any) => target.name === "Prospect Pipeline");
  const pipelineAchievement = pipelineTarget?.achievement ?? null;
  const pipelineGap = pipelineTarget ? Math.max(0, pipelineTarget.target - pipelineTarget.actual) : null;

  const latestTalkingPoint = talkingPoints?.[0];

  const nudges: CoachingNudge[] = [];

  if (healthSummary.averageScore < 80 || healthSummary.distribution['at-risk'] > 0) {
    const focusClients = atRiskClients.map((record) => record.clientName).join(', ');
    nudges.push({
      goal: "Client Relationship Management",
      headline: `Relationship health averages ${healthSummary.averageScore}/100 (${healthSummary.dominantStatusLabel}).`,
      detail: focusClients
        ? `Reinforce outreach with ${focusClients} to stabilise loyalty.`
        : "Schedule proactive check-ins to keep sentiment high.",
      actionLabel: "Open Relationship Insights",
      actionHref: "/clients",
      tone: healthSummary.averageScore < 65 ? "critical" : "caution",
      icon: <Users className="h-4 w-4" />,
    });
  }

  if (pipelineAchievement !== null) {
    const tone: NudgeTone = pipelineAchievement < 60 ? "critical" : pipelineAchievement < 85 ? "caution" : "neutral";
    const gapLabel = pipelineGap ? `Bridge ${formatCurrencyCompact(pipelineGap)} to close the gap.` : "";
    nudges.push({
      goal: "Prospect Pipeline Management",
      headline: `Pipeline pacing at ${pipelineAchievement}% of target.`,
      detail:
        activeProspects.length > 0
          ? `${activeProspects.length} active prospects can unlock the next wins. ${gapLabel}`.trim()
          : `Activate dormant prospects to protect quarterly revenue. ${gapLabel}`.trim(),
      actionLabel: "Review Prospect Pipeline",
      actionHref: "/prospects",
      tone,
      icon: <Target className="h-4 w-4" />,
    });
  }

  if (overdueTasks > 0 || highPriorityTasks > 0) {
    const tone: NudgeTone = overdueTasks > 5 || highPriorityTasks > 2 ? "critical" : "caution";
    nudges.push({
      goal: "Task & Calendar Management",
      headline: `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'} flagged.`,
      detail:
        highPriorityTasks > 0
          ? `${highPriorityTasks} high-priority follow-ups need reassignment or closure.`
          : "Sweep overdue actions to keep service levels tight.",
      actionLabel: "Prioritise Task Hub",
      actionHref: "/tasks",
      tone,
      icon: <ListChecks className="h-4 w-4" />,
    });
  }

  if (latestTalkingPoint) {
    const tone: NudgeTone = atRiskClients.length > 0 ? "neutral" : "positive";
    nudges.push({
      goal: "Knowledge Management",
      headline: `Share "${latestTalkingPoint.title}" in upcoming conversations.`,
      detail:
        atRiskClients.length > 0
          ? `Use this talking point with ${atRiskClients[0].clientName} to reset momentum.`
          : "Keep the advisory narrative fresh across your top households.",
      actionLabel: "Review Talking Points",
      actionHref: "/talking-points",
      tone,
      icon: <BookOpen className="h-4 w-4" />,
    });
  }

  if (nudges.length === 0) {
    nudges.push({
      goal: "Client Relationship Management",
      headline: "Book health is stable. Double down on momentum plays.",
      detail: "No critical risks detected today. Celebrate wins and keep learning loops tight.",
      actionLabel: "Browse Opportunities",
      actionHref: "/analytics",
      tone: "positive",
      icon: <Lightbulb className="h-4 w-4" />,
    });
  }

  if (isLoading) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Coaching Nudges</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Align daily execution with ABC Bank&apos;s relationship, pipeline, and enablement goals.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={idx} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Coaching Nudges</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Guided by strategic goals
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Focus areas mapped to relationship depth, pipeline velocity, task hygiene, and knowledge sharing.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {nudges.map((nudge, index) => {
          const tone = TONE_STYLES[nudge.tone];
          return (
            <div
              key={`${nudge.goal}-${index}`}
              className={cn(
                "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                tone.border,
                tone.background
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("p-1.5 rounded-full", tone.icon)}>{nudge.icon}</span>
                    <Badge variant="outline" className={cn("text-xs", tone.badge)}>
                      {nudge.goal}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{nudge.headline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{nudge.detail}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(nudge.actionHref)}
                  className="shrink-0"
                >
                  {nudge.actionLabel}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
