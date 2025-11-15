import { differenceInHours, differenceInMinutes, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { ActionItemCategory, NormalizedActionItem, OrchestratedActionItems } from "@/types/dashboard";
import type { PortfolioDelta } from "@shared/types";

interface ApiTask {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
  status?: string;
}

interface ApiAppointment {
  id: number;
  title: string;
  clientName?: string;
  startTime: string;
  endTime: string;
  location?: string;
  priority?: string;
  type?: string;
}

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${input}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const severityScore: Record<string, number> = {
  critical: 95,
  high: 80,
  medium: 55,
  low: 35,
};

const priorityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

function normalisePriority(priority?: string, fallback: "high" | "medium" | "low" = "medium") {
  if (!priority) return fallback;
  const lowered = priority.toLowerCase();
  return priorityMap[lowered] ?? fallback;
}

function scoreTask(task: ApiTask): NormalizedActionItem | null {
  if (task.completed) {
    return null;
  }

  const now = new Date();
  let priority = normalisePriority(task.priority);
  let score = severityScore[priority];
  let subtitle = "";

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const hoursToDue = differenceInHours(dueDate, now);
    subtitle = `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`;

    if (hoursToDue < 0) {
      score += 25;
      priority = "critical";
    } else if (hoursToDue <= 24) {
      score += 15;
      priority = priority === "low" ? "medium" : priority;
    } else if (hoursToDue <= 72) {
      score += 8;
    }
  }

  if (task.status && task.status.toLowerCase() === "blocked") {
    score += 10;
    priority = "high";
  }

  return {
    id: `task-${task.id}`,
    type: "task",
    title: task.title,
    subtitle,
    details: task.description,
    priority,
    score,
    meta: {
      priorityLabel: task.priority,
      dueDate: task.dueDate,
    },
  };
}

function scoreAppointment(appointment: ApiAppointment): NormalizedActionItem {
  const now = new Date();
  const start = new Date(appointment.startTime);
  const minutesToStart = differenceInMinutes(start, now);
  let priority = normalisePriority(appointment.priority, "high");
  let score = severityScore[priority];

  if (minutesToStart < 0) {
    score -= 10;
  } else if (minutesToStart <= 60) {
    score += 20;
    priority = "critical";
  } else if (minutesToStart <= 180) {
    score += 10;
  }

  return {
    id: `appointment-${appointment.id}`,
    type: "appointment",
    title: appointment.title,
    subtitle: appointment.clientName ? `${appointment.clientName}` : undefined,
    details: `${formatDistanceToNow(start, { addSuffix: true })} • ${appointment.location || appointment.type || "Meeting"}`,
    priority,
    score,
    meta: {
      clientName: appointment.clientName,
      dueDate: appointment.startTime,
      location: appointment.location,
    },
  };
}

function scoreDelta(delta: PortfolioDelta): NormalizedActionItem {
  const mappedPriority = delta.impact === "moderate" ? "medium" : (delta.impact as "critical" | "high" | "medium" | "low");
  let score = severityScore[mappedPriority] ?? 40;

  if (delta.deltaType === "allocation-drift" && Math.abs(delta.deltaValue) >= 5) {
    score += 12;
  }

  if (delta.timeframe.includes("24") || delta.timeframe.includes("1d")) {
    score += 8;
  }

  if (delta.direction === "down" && delta.deltaType === "performance") {
    score += 10;
  }

  return {
    id: `delta-${delta.id}`,
    type: "portfolioDelta",
    title: `${delta.clientName} • ${delta.summary}`,
    subtitle: `${delta.deltaValue.toFixed(1)}% ${delta.direction === "up" ? "increase" : "decrease"}`,
    details: `Window: ${delta.timeframe}`,
    priority: mappedPriority,
    score,
    meta: {
      clientName: delta.clientName,
      timeframe: delta.timeframe,
      severity: delta.impact,
      delta,
    },
  };
}

async function orchestrateActionItems(): Promise<OrchestratedActionItems> {
  const [tasks, appointments, deltas] = await Promise.all([
    fetchJson<ApiTask[]>("/api/tasks"),
    fetchJson<ApiAppointment[]>("/api/appointments"),
    fetchJson<PortfolioDelta[]>("/api/portfolio/deltas"),
  ]);

  const normalizedTasks = (Array.isArray(tasks) ? tasks : [])
    .map(scoreTask)
    .filter(Boolean) as NormalizedActionItem[];

  const normalizedAppointments = (Array.isArray(appointments) ? appointments : [])
    .map(scoreAppointment);

  const normalizedDeltas = (Array.isArray(deltas) ? deltas : [])
    .map(scoreDelta);

  const compareScore = (a: NormalizedActionItem, b: NormalizedActionItem) => b.score - a.score;

  normalizedTasks.sort(compareScore);
  normalizedAppointments.sort(compareScore);
  normalizedDeltas.sort(compareScore);

  const categories: ActionItemCategory[] = [
    {
      key: "task",
      title: "Priority Tasks",
      description: "Tasks and follow-ups organised by urgency and due date.",
      items: normalizedTasks,
      totalCount: normalizedTasks.length,
    },
    {
      key: "appointment",
      title: "Upcoming Meetings",
      description: "Scheduled client meetings ordered by proximity to now.",
      items: normalizedAppointments,
      totalCount: normalizedAppointments.length,
    },
    {
      key: "portfolioDelta",
      title: "Portfolio Signals",
      description: "Material shifts in portfolio posture requiring intervention.",
      items: normalizedDeltas,
      totalCount: normalizedDeltas.length,
    },
  ];

  const topItems = [...normalizedTasks, ...normalizedAppointments, ...normalizedDeltas]
    .sort(compareScore)
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    categories,
    topItems,
  };
}

export function useActionItemOrchestration() {
  return useQuery<OrchestratedActionItems>({
    queryKey: ["dashboard", "action-items"],
    queryFn: orchestrateActionItems,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
