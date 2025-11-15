import type { BriefingDepth, BriefingTone } from "@/context/preferences-context";
import type { PortfolioDelta } from "@shared/types";

export type ActionItemType = "task" | "appointment" | "portfolioDelta";

export interface ActionItemMeta {
  clientName?: string;
  dueDate?: string;
  timeframe?: string;
  location?: string;
  priorityLabel?: string;
  severity?: string;
  delta?: PortfolioDelta;
}

export interface NormalizedActionItem {
  id: string;
  type: ActionItemType;
  title: string;
  subtitle?: string;
  details?: string;
  priority: "critical" | "high" | "medium" | "low";
  score: number;
  meta: ActionItemMeta;
}

export interface ActionItemCategory {
  key: ActionItemType;
  title: string;
  description: string;
  items: NormalizedActionItem[];
  totalCount: number;
}

export interface OrchestratedActionItems {
  generatedAt: string;
  categories: ActionItemCategory[];
  topItems: NormalizedActionItem[];
}

export interface DashboardBriefingMetric {
  label: string;
  value: string;
  change?: string;
  direction?: "up" | "down" | "flat";
}

export interface DashboardBriefing {
  summary: string;
  highlights: Array<{ title: string; detail: string }>;
  nextBestActions: string[];
  metrics: DashboardBriefingMetric[];
  generatedAt: string;
  tone: BriefingTone;
  depth: BriefingDepth;
}
