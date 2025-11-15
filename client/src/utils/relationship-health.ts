import type { Client } from "@shared/schema";

export type RelationshipHealthStatus = "strong" | "steady" | "watch" | "at-risk";

type MaybeDate = string | Date | null | undefined;

type TaskLike = {
  id?: number;
  clientId?: number | null;
  client_id?: number | null;
  dueDate?: MaybeDate;
  due_date?: MaybeDate;
  completed?: boolean | null;
  priority?: string | null;
};

type AppointmentLike = {
  id?: number;
  clientId?: number | null;
  client_id?: number | null;
  startTime?: MaybeDate;
  start_time?: MaybeDate;
};

type AlertLike = {
  id?: number;
  clientId?: number | null;
  client_id?: number | null;
  severity?: string | null;
  title?: string | null;
};

export interface RelationshipHealthSignals {
  daysSinceLastContact: number | null;
  meetingsPast30Days: number;
  upcomingMeetings: number;
  overdueTasks: number;
  openHighPriorityTasks: number;
  highSeverityAlerts: number;
  mediumSeverityAlerts: number;
  hasComplaints: boolean;
  performanceReturn: number | null;
}

export interface RelationshipHealthRecord {
  clientId: number;
  clientName: string;
  score: number;
  status: RelationshipHealthStatus;
  statusLabel: string;
  strengths: string[];
  risks: string[];
  recommendedFocus?: string;
  signals: RelationshipHealthSignals;
}

export interface RelationshipHealthSummary {
  averageScore: number;
  dominantStatus: RelationshipHealthStatus;
  dominantStatusLabel: string;
  distribution: Record<RelationshipHealthStatus, number>;
  strengths: Array<{ label: string; count: number }>;
  risks: Array<{ label: string; count: number }>;
  atRiskClients: RelationshipHealthRecord[];
}

const STATUS_LABELS: Record<RelationshipHealthStatus, string> = {
  strong: "Strong",
  steady: "Steady",
  watch: "Watch",
  "at-risk": "At Risk",
};

const STATUS_TONES: Record<RelationshipHealthStatus, "positive" | "neutral" | "caution" | "critical"> = {
  strong: "positive",
  steady: "neutral",
  watch: "caution",
  "at-risk": "critical",
};

export interface RelationshipHealthStatusMeta {
  label: string;
  tone: "positive" | "neutral" | "caution" | "critical";
}

export const relationshipHealthStatusMeta: Record<RelationshipHealthStatus, RelationshipHealthStatusMeta> = {
  strong: { label: STATUS_LABELS.strong, tone: STATUS_TONES.strong },
  steady: { label: STATUS_LABELS.steady, tone: STATUS_TONES.steady },
  watch: { label: STATUS_LABELS.watch, tone: STATUS_TONES.watch },
  "at-risk": { label: STATUS_LABELS["at-risk"], tone: STATUS_TONES["at-risk"] },
};

function toDate(value: MaybeDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(now: Date, other: Date | null): number | null {
  if (!other) return null;
  const diff = now.getTime() - other.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalisePerformanceReturn(value: number | null): number {
  if (value === null || Number.isNaN(value)) {
    return 65;
  }
  if (value >= 12) return 95;
  if (value >= 8) return 88;
  if (value >= 4) return 74;
  if (value >= 0) return 60;
  if (value >= -5) return 40;
  return 25;
}

function statusFromScore(score: number): RelationshipHealthStatus {
  if (score >= 85) return "strong";
  if (score >= 70) return "steady";
  if (score >= 55) return "watch";
  return "at-risk";
}

export function calculateRelationshipHealth(
  client: Partial<Client> & { id: number; fullName?: string | null },
  options: {
    tasks?: TaskLike[];
    appointments?: AppointmentLike[];
    alerts?: AlertLike[];
  }
): RelationshipHealthRecord {
  const now = new Date();
  const clientId = client.id;
  const clientName = client.fullName ?? (client as any).full_name ?? "Client";

  const clientTasks = (options.tasks ?? []).filter(task => {
    const id = task.clientId ?? task.client_id;
    return id === clientId;
  });

  const clientAppointments = (options.appointments ?? []).filter(appointment => {
    const id = appointment.clientId ?? appointment.client_id;
    return id === clientId;
  });

  const clientAlerts = (options.alerts ?? []).filter(alert => {
    const id = alert.clientId ?? alert.client_id;
    return id === clientId;
  });

  const lastContact = toDate((client as any).lastContactDate ?? (client as any).last_contact_date ?? null);
  const daysSinceLastContact = daysBetween(now, lastContact);

  const meetingsPast30Days = clientAppointments.filter(appointment => {
    const start = toDate(appointment.startTime ?? appointment.start_time ?? null);
    if (!start) return false;
    return start >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) && start <= now;
  }).length;

  const upcomingMeetings = clientAppointments.filter(appointment => {
    const start = toDate(appointment.startTime ?? appointment.start_time ?? null);
    if (!start) return false;
    return start > now && start <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;

  const overdueTasks = clientTasks.filter(task => {
    if (task.completed) return false;
    const due = toDate(task.dueDate ?? task.due_date ?? null);
    if (!due) return false;
    return due < now;
  }).length;

  const openHighPriorityTasks = clientTasks.filter(task => {
    if (task.completed) return false;
    const priority = (task.priority ?? "").toString().toLowerCase();
    return priority === "high" || priority === "urgent";
  }).length;

  let highSeverityAlerts = 0;
  let mediumSeverityAlerts = 0;
  let hasComplaints = false;
  clientAlerts.forEach(alert => {
    const severity = (alert.severity ?? "medium").toString().toLowerCase();
    if (severity === "high" || severity === "critical") {
      highSeverityAlerts += 1;
    } else if (severity === "medium") {
      mediumSeverityAlerts += 1;
    }
    const title = (alert.title ?? "").toString().toLowerCase();
    if (title.includes("complaint") || title.includes("grievance")) {
      hasComplaints = true;
    }
  });

  const performanceReturn = (() => {
    const primary = (client as any).oneYearReturn ?? (client as any).one_year_return;
    if (typeof primary === "number") return primary;
    const fallback = (client as any).yearlyPerformance ?? (client as any).yearly_performance;
    return typeof fallback === "number" ? fallback : null;
  })();

  const contactScore = (() => {
    if (daysSinceLastContact === null) return 70;
    const normalised = 100 - clamp(daysSinceLastContact, 0, 120) / 120 * 100;
    return clamp(normalised, 10, 100);
  })();

  const taskScore = (() => {
    const penalty = Math.min(overdueTasks * 22 + openHighPriorityTasks * 12, 100);
    return 100 - penalty;
  })();

  const alertScore = (() => {
    const complaintPenalty = hasComplaints ? 18 : 0;
    const penalty = Math.min(highSeverityAlerts * 28 + mediumSeverityAlerts * 14 + complaintPenalty, 100);
    return 100 - penalty;
  })();

  const performanceScore = normalisePerformanceReturn(performanceReturn);

  const engagementScore = (() => {
    let base = clamp((meetingsPast30Days / 4) * 100, 0, 100);
    if (upcomingMeetings > 0) {
      base = clamp(base + 8, 0, 100);
    }
    return base;
  })();

  const weights = {
    contact: 0.3,
    tasks: 0.25,
    alerts: 0.2,
    performance: 0.15,
    engagement: 0.1,
  } as const;

  const weightedScore =
    contactScore * weights.contact +
    taskScore * weights.tasks +
    alertScore * weights.alerts +
    performanceScore * weights.performance +
    engagementScore * weights.engagement;

  const score = Math.round(clamp(weightedScore, 0, 100));
  const status = statusFromScore(score);
  const statusLabel = STATUS_LABELS[status];

  const strengths: string[] = [];
  const risks: string[] = [];

  if (meetingsPast30Days >= 2) {
    strengths.push("Consistent engagement in the last month");
  }
  if (upcomingMeetings > 0) {
    strengths.push("Upcoming touchpoints scheduled");
  }
  if (overdueTasks === 0) {
    strengths.push("No overdue tasks");
  }
  if (performanceReturn !== null && performanceReturn >= 6) {
    strengths.push("Portfolio performance is delivering above benchmarks");
  }

  if (daysSinceLastContact !== null && daysSinceLastContact > 60) {
    risks.push("Contact gap exceeds 60 days");
  }
  if (overdueTasks > 0) {
    risks.push(`${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""}`);
  }
  if (openHighPriorityTasks > 0) {
    risks.push(`${openHighPriorityTasks} high-priority task${openHighPriorityTasks > 1 ? "s" : ""} still open`);
  }
  if (highSeverityAlerts > 0) {
    risks.push(`Active high-severity alert${highSeverityAlerts > 1 ? "s" : ""}`);
  }
  if (hasComplaints) {
    risks.push("Recent complaint flagged by client");
  }
  if (performanceReturn !== null && performanceReturn < 0) {
    risks.push("Portfolio returns are negative");
  }

  const recommendedFocus = (() => {
    if (risks.length > 0) return risks[0];
    if (status === "steady") return "Maintain cadence with proactive outreach";
    return undefined;
  })();

  return {
    clientId,
    clientName,
    score,
    status,
    statusLabel,
    strengths,
    risks,
    recommendedFocus,
    signals: {
      daysSinceLastContact,
      meetingsPast30Days,
      upcomingMeetings,
      overdueTasks,
      openHighPriorityTasks,
      highSeverityAlerts,
      mediumSeverityAlerts,
      hasComplaints,
      performanceReturn,
    },
  };
}

export function summarizeRelationshipHealth(records: RelationshipHealthRecord[]): RelationshipHealthSummary {
  if (records.length === 0) {
    const emptyDistribution: Record<RelationshipHealthStatus, number> = {
      strong: 0,
      steady: 0,
      watch: 0,
      "at-risk": 0,
    };
    return {
      averageScore: 0,
      dominantStatus: "watch",
      dominantStatusLabel: STATUS_LABELS.watch,
      distribution: emptyDistribution,
      strengths: [],
      risks: [],
      atRiskClients: [],
    };
  }

  const averageScore = Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length);
  const averageStatus = statusFromScore(averageScore);

  const distribution = records.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] ?? 0) + 1;
    return acc;
  }, {
    strong: 0,
    steady: 0,
    watch: 0,
    "at-risk": 0,
  } as Record<RelationshipHealthStatus, number>);

  const dominantStatus = (Object.entries(distribution) as Array<[RelationshipHealthStatus, number]>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? averageStatus;

  const strengthCounts = new Map<string, number>();
  const riskCounts = new Map<string, number>();
  records.forEach(record => {
    record.strengths.forEach(strength => {
      strengthCounts.set(strength, (strengthCounts.get(strength) ?? 0) + 1);
    });
    record.risks.forEach(risk => {
      riskCounts.set(risk, (riskCounts.get(risk) ?? 0) + 1);
    });
  });

  const strengths = Array.from(strengthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const risks = Array.from(riskCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const atRiskClients = records
    .filter(record => record.status === "at-risk" || record.status === "watch")
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return {
    averageScore,
    dominantStatus,
    dominantStatusLabel: STATUS_LABELS[dominantStatus],
    distribution,
    strengths,
    risks,
    atRiskClients,
  };
}

export function getRelationshipHealthStatusMeta(status: RelationshipHealthStatus): RelationshipHealthStatusMeta {
  return relationshipHealthStatusMeta[status];
}
