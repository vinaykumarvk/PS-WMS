import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  Search,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  Download,
  MoreHorizontal,
  FileText,
  Send,
  Loader2,
  Lightbulb,
  Sparkles,
  Activity,
  ArrowDownRight,
  CircleDollarSign,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { formatCurrency, formatRelativeDate, getStageColor } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface FilterOptions {
  minPotentialAum: number;
  maxPotentialAum: number;
  minProbabilityScore: number;
  maxProbabilityScore: number;
  includedStages: string[];
}

const STAGE_TITLES: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

interface Prospect {
  id: number;
  fullName: string;
  initials?: string | null;
  potentialAum?: string | null;
  potentialAumValue?: number | null;
  email?: string | null;
  phone?: string | null;
  stage: string;
  lastContactDate?: string | null;
  probabilityScore?: number | null;
  productsOfInterest?: string | string[] | null;
  notes?: string | null;
}

interface ProposalActionResult {
  proposalId: string;
  status: "draft" | "finalized";
  summary: string;
  recommendedProducts: string[];
  followUpActions: string[];
  confidence?: number;
  generatedAt?: string;
  nextMilestone?: string;
  potentialValue?: number | null;
}

interface StageInsight {
  likelihood: number;
  message: string;
  spotlight?: string;
}

interface PersonaBrief {
  title: string;
  summary: string;
  motivators: string[];
  engagementTips: string[];
}

interface ProspectCardProps {
  prospect: Prospect;
  onClick: (id: number) => void;
  onGenerateProposal?: (prospectId: number) => Promise<ProposalActionResult>;
  onFinalizeProposal?: (prospectId: number) => Promise<ProposalActionResult>;
  latestProposal?: ProposalActionResult | null;
}

function ProspectCard({
  prospect,
  onClick,
  onGenerateProposal,
  onFinalizeProposal,
  latestProposal
}: ProspectCardProps) {
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [localProposal, setLocalProposal] = useState<ProposalActionResult | null>(latestProposal ?? null);

  useEffect(() => {
    setLocalProposal(latestProposal ?? null);
  }, [latestProposal]);

  const probability = prospect.probabilityScore ?? 0;
  const initials = prospect.initials || (prospect.fullName ? prospect.fullName.split(" ").map(part => part[0]).join('').slice(0, 2).toUpperCase() : "PR");
  const products = Array.isArray(prospect.productsOfInterest)
    ? prospect.productsOfInterest
    : typeof prospect.productsOfInterest === "string"
      ? prospect.productsOfInterest.split(",").map(item => item.trim()).filter(Boolean)
      : [];
  const productsDisplay = products.join(", ");

  const handleGenerateDraft = async () => {
    if (!onGenerateProposal) return;
    try {
      setIsDraftLoading(true);
      const result = await onGenerateProposal(prospect.id);
      setLocalProposal(result);
    } catch (error) {
      console.error("Draft proposal generation failed", error);
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleFinalizeProposal = async () => {
    if (!onFinalizeProposal) return;
    try {
      setIsFinalizing(true);
      const result = await onFinalizeProposal(prospect.id);
      setLocalProposal(result);
    } catch (error) {
      console.error("Final proposal generation failed", error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const hasActions = Boolean(onGenerateProposal || onFinalizeProposal);
  const readinessLabel = localProposal?.confidence !== undefined ? `${localProposal.confidence}% confidence` : null;
  const generatedRelative = localProposal?.generatedAt ? formatRelativeDate(localProposal.generatedAt) : null;

  return (
    <div
      className="bg-card p-4 rounded-lg shadow-sm mb-3 cursor-pointer border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/10 transform interactive-hover"
      onClick={() => onClick(prospect.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm transition-all duration-300 hover:bg-primary/20 hover:scale-110">
            {initials}
          </div>
          <h3 className="text-sm font-medium text-foreground ml-3">{prospect.fullName}</h3>
        </div>
        <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full transition-all duration-300 hover:bg-primary/20">
          {probability}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-2 leading-relaxed">
        <span className="font-semibold text-foreground">Potential: </span>
        <span className="font-medium">{prospect.potentialAum || "Not specified"}</span>
      </div>
      {productsDisplay && (
        <div className="text-xs text-muted-foreground mb-2 leading-relaxed">
          <span className="font-semibold text-foreground">Products: </span>
          <span className="font-medium">{productsDisplay}</span>
        </div>
      )}
      <div className="text-xs text-muted-foreground/80 leading-relaxed">
        <span className="font-semibold text-foreground">Last Contact: </span>
        <span className="font-medium">{formatRelativeDate(prospect.lastContactDate)}</span>
      </div>
      {hasActions && (
        <div className="mt-3 flex items-start gap-3">
          <div className="flex-1 min-w-0 text-[11px] text-muted-foreground leading-relaxed">
            {localProposal ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
                  <span className="font-semibold capitalize">{localProposal.status === "draft" ? "Draft ready" : "Finalized"}</span>
                  {readinessLabel && <span className="text-primary font-medium">{readinessLabel}</span>}
                  {generatedRelative && <span className="text-muted-foreground/70">{generatedRelative}</span>}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{localProposal.summary}</p>
              </div>
            ) : (
              <p>Use quick actions to spin up a personalized proposal narrative.</p>
            )}
          </div>
          <div onClick={event => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  {isDraftLoading || isFinalizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {onGenerateProposal && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={async () => {
                      await handleGenerateDraft();
                    }}
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Generate draft proposal</span>
                  </DropdownMenuItem>
                )}
                {onFinalizeProposal && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={async () => {
                      await handleFinalizeProposal();
                    }}
                  >
                    <Send className="h-4 w-4 text-primary" />
                    <span>Finalize &amp; share proposal</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}

interface PipelineColumnProps {
  title: string;
  prospects: Prospect[];
  stage: string;
  onProspectClick: (id: number) => void;
  isMobile?: boolean;
  stageInsight?: StageInsight;
  onGenerateProposal?: (prospectId: number) => Promise<ProposalActionResult>;
  onFinalizeProposal?: (prospectId: number) => Promise<ProposalActionResult>;
  proposalInsights?: Record<number, ProposalActionResult>;
}

// Funnel Chart Component
interface FunnelChartProps {
  prospects: Prospect[];
  stages: { id: string; title: string }[];
}

function FunnelChart({ prospects, stages }: FunnelChartProps) {
  const pipelineStages = stages.filter(stage => !['won', 'lost'].includes(stage.id));

  const funnelData = pipelineStages.map((stage, index) => {
    const stageProspects = prospects.filter(p => (p.stage || '').toLowerCase() === stage.id);
    const count = stageProspects.length;
    const totalValue = stageProspects.reduce((sum, prospect) => sum + (prospect.potentialAumValue || 0), 0);
    const valueInCrores = totalValue / 10000000;
    const averageProbability = stageProspects.length > 0
      ? Math.round(stageProspects.reduce((sum, prospect) => sum + (prospect.probabilityScore ?? 0), 0) / stageProspects.length)
      : 0;

    const getStageHexColor = (stageId: string) => {
      switch (stageId.toLowerCase()) {
        case 'new': return '#10b981';
        case 'qualified': return '#3b82f6';
        case 'proposal': return '#2E98D3';
        case 'negotiation': return '#8b5cf6';
        case 'won': return '#22c55e';
        case 'lost': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return {
      stage: stage.title,
      stageId: stage.id,
      count,
      potentialValue: valueInCrores,
      rawValue: totalValue,
      color: getStageHexColor(stage.id),
      percentage: prospects.length > 0 ? Math.round((count / prospects.length) * 100) : 0,
      level: index,
      avgProbability: averageProbability
    };
  });

  const totalProspects = prospects.length;
  const wonCount = prospects.filter(p => (p.stage || '').toLowerCase() === 'won').length;
  const lostCount = prospects.filter(p => (p.stage || '').toLowerCase() === 'lost').length;
  const activeCount = prospects.filter(p => !['won', 'lost'].includes((p.stage || '').toLowerCase())).length;
  const hasData = funnelData.some(item => item.count > 0);
  const totalPipelineValue = funnelData.reduce((sum, item) => sum + item.rawValue, 0);
  const conversionRate = totalProspects > 0 ? Math.round((wonCount / totalProspects) * 100) : 0;

  const dropOffs = funnelData
    .map((item, index) => {
      const next = funnelData[index + 1];
      if (!next) return null;
      const drop = item.count > 0 ? Math.max(0, Math.round(((item.count - next.count) / item.count) * 100)) : 0;
      return { stage: `${item.stage} → ${next.stage}`, drop };
    })
    .filter(Boolean) as { stage: string; drop: number }[];

  const largestDropOff = dropOffs.reduce<{ stage: string; drop: number } | null>((max, current) => {
    if (!max || current.drop > max.drop) {
      return current;
    }
    return max;
  }, null);

  const stageNeedingAttention = funnelData
    .filter(item => !['won', 'lost'].includes(item.stageId) && item.rawValue > 0 && item.avgProbability < 60)
    .sort((a, b) => b.rawValue - a.rawValue)[0] ?? null;

  const healthiestStage = funnelData
    .filter(item => item.count > 0)
    .sort((a, b) => b.avgProbability - a.avgProbability)[0] ?? null;

  const summaryInsights = hasData
    ? [
        {
          title: "Conversion pulse",
          description:
            conversionRate > 0
              ? `${conversionRate}% conversion (${wonCount} of ${totalProspects}) ${conversionRate >= 30 ? 'signals healthy momentum.' : 'suggests deeper coaching is needed.'}`
              : 'No closed wins yet—coach teams on proposal follow-through.',
          icon: Activity,
        },
        {
          title: "Largest drop-off",
          description: largestDropOff
            ? `${largestDropOff.drop}% drop between ${largestDropOff.stage}. Focus enablement conversations here this week.`
            : 'Pipeline flow is consistent across stages—maintain current rhythm.',
          icon: ArrowDownRight,
        },
        {
          title: "Pipeline value",
          description: `Active stages hold ${formatCurrency(totalPipelineValue)} across ${activeCount} opportunities. Prioritize high-value follow-ups.`,
          icon: CircleDollarSign,
        },
        stageNeedingAttention
          ? {
              title: `${stageNeedingAttention.stage} needs focus`,
              description: `${formatCurrency(stageNeedingAttention.rawValue)} sitting here with ${stageNeedingAttention.avgProbability}% readiness. Coach the RM team to unlock progression.`,
              icon: Lightbulb,
            }
          : {
              title: healthiestStage ? `${healthiestStage.stage} momentum` : 'Momentum driver',
              description: healthiestStage
                ? `${healthiestStage.avgProbability}% average readiness—bottle these plays for the rest of the funnel.`
                : 'Engage fresh leads to build velocity through the funnel.',
              icon: TrendingUp,
            },
      ]
    : [
        {
          title: "Pipeline empty",
          description: 'Add prospects to generate funnel analytics and next best actions.',
          icon: Sparkles,
        },
        {
          title: "Suggested next step",
          description: 'Import CRM leads or launch outreach to populate the top of the funnel.',
          icon: TrendingUp,
        },
      ];

  return (
    <Card className="mb-6 !bg-card !border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 transform hover:scale-[1.01] interactive-hover">
      <div className="p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 text-center">Sales Pipeline Funnel</h3>

        {hasData ? (
          <>
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex justify-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="space-y-0">
                      {funnelData.map((item, index) => {
                        const maxValue = Math.max(...funnelData.map(d => d.potentialValue));
                        const minWidth = 100;
                        const maxWidth = 240;
                        const proportionateWidth = maxValue > 0
                          ? minWidth + ((item.potentialValue / maxValue) * (maxWidth - minWidth))
                          : minWidth;

                        return (
                          <div key={item.stageId} className="flex flex-col items-center">
                            <div
                              className="relative flex items-center justify-center text-white font-medium text-sm py-2 px-3 transition-all duration-300 hover:brightness-110"
                              style={{
                                backgroundColor: item.color,
                                width: `${proportionateWidth}px`,
                                clipPath: index === funnelData.length - 1
                                  ? 'polygon(20% 0%, 80% 0%, 65% 100%, 35% 100%)'
                                  : 'polygon(15% 0%, 85% 0%, 80% 100%, 20% 100%)',
                                minHeight: '40px'
                              }}
                            >
                              <div className="text-center">
                                <div className="font-semibold text-sm">{item.stage}</div>
                                <div className="text-xs mt-0.5 font-medium">{item.count} prospects</div>
                                <div className="text-xs font-medium">₹{item.potentialValue.toFixed(1)} Cr</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/3 w-full space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Funnel health insights</h4>
                <div className="space-y-2">
                  {summaryInsights.map(item => (
                    <div key={item.title} className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <item.icon className="h-4 w-4 text-primary" />
                        <span>{item.title}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Active prospects</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{activeCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Won deals</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{wonCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Lost deals</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{lostCount}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No prospects data available
          </div>
        )}
      </div>
    </Card>
  );
}

function normalizeProspectRecord(raw: Prospect): Prospect {
  const normalizedStage = (raw.stage || 'new').toLowerCase();
  const probabilityValue = typeof raw.probabilityScore === 'number'
    ? raw.probabilityScore
    : raw.probabilityScore
      ? Number(raw.probabilityScore)
      : 0;
  const potentialValue = typeof raw.potentialAumValue === 'number'
    ? raw.potentialAumValue
    : raw.potentialAumValue
      ? Number(raw.potentialAumValue)
      : null;
  const products = Array.isArray(raw.productsOfInterest)
    ? raw.productsOfInterest
    : typeof raw.productsOfInterest === 'string'
      ? raw.productsOfInterest.split(',').map(item => item.trim()).filter(Boolean)
      : [];

  return {
    ...raw,
    stage: normalizedStage,
    probabilityScore: Number.isFinite(probabilityValue) ? probabilityValue : 0,
    potentialAumValue: potentialValue,
    productsOfInterest: products,
  };
}

function buildPersonaBrief(prospect: Prospect): PersonaBrief {
  const value = prospect.potentialAumValue ?? 0;
  const stage = (prospect.stage || 'new').toLowerCase();
  const probability = prospect.probabilityScore ?? 0;
  const interests = Array.isArray(prospect.productsOfInterest)
    ? prospect.productsOfInterest
    : typeof prospect.productsOfInterest === 'string'
      ? prospect.productsOfInterest.split(',').map(item => item.trim()).filter(Boolean)
      : [];

  let title: string;
  if (value >= 30000000) {
    title = "Strategic wealth steward";
  } else if (value >= 15000000) {
    title = "Growth-focused HNI";
  } else {
    title = "Emerging affluent builder";
  }

  const summaryParts: string[] = [
    `${prospect.fullName?.split(' ')[0] || 'Prospect'} is in the ${STAGE_TITLES[stage] || stage} stage with ${probability}% confidence.`
  ];

  if (interests.length) {
    summaryParts.push(`Currently evaluating ${interests.join(', ')} solutions.`);
  }

  if (value) {
    summaryParts.push(`Potential inflow of ${formatCurrency(value)} can materially uplift managed assets.`);
  }

  const motivators = new Set<string>();
  if (interests.length) {
    motivators.add(`Tailored guidance around ${interests[0]}.`);
  }
  if (value >= 15000000) {
    motivators.add("Structured wealth preservation with tactical alpha opportunities.");
  } else {
    motivators.add("Clear goal-based accumulation roadmap with disciplined SIPs.");
  }
  motivators.add(probability >= 60 ? "Fast, low-friction execution experience." : "Confidence-building proof points and peer success stories.");

  const engagementTips: string[] = [];
  if (stage === 'new') {
    engagementTips.push("Lead with discovery on life events, liquidity windows, and trigger moments.");
  } else if (stage === 'qualified') {
    engagementTips.push("Anchor conversations in quantified outcomes and milestone timelines.");
  } else if (stage === 'proposal') {
    engagementTips.push("Share implementation roadmap and pre-empt compliance or documentation queries.");
  }

  if (probability < 60) {
    engagementTips.push("Address objections early with data-backed narratives and testimonials.");
  } else {
    engagementTips.push("Confirm commitment milestones and lock the onboarding date.");
  }

  if (interests.includes("Wealth Management") || interests.includes("Portfolio Management")) {
    engagementTips.push("Highlight discretionary portfolio monitoring with quarterly executive briefings.");
  }

  return {
    title,
    summary: summaryParts.join(' '),
    motivators: Array.from(motivators),
    engagementTips: Array.from(new Set(engagementTips)),
  };
}

function PipelineColumn({ title, prospects, stage, onProspectClick, isMobile = false, stageInsight, onGenerateProposal, onFinalizeProposal, proposalInsights }: PipelineColumnProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const stageColor = getStageColor(stage);

  return (
    <Card className={`${isMobile ? 'mb-4 w-full' : 'w-72 shrink-0'} !bg-card !border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 transform hover:scale-[1.01] interactive-hover`}>
      {isMobile ? (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div
              className="flex items-center justify-between p-3 border-b border-border cursor-pointer"
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${stageColor.bg}`}
                ></div>
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-background rounded-full px-2 py-0.5 text-foreground">
                  {prospects.length}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-foreground" /> : <ChevronDown className="h-4 w-4 text-foreground" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 max-h-[60vh] overflow-auto">
              {stageInsight && (
                <div className="mb-3 rounded-md border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold uppercase tracking-wide">Next-stage readiness</span>
                    </div>
                    <span className="font-semibold text-primary">{stageInsight.likelihood}%</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{stageInsight.message}</p>
                  {stageInsight.spotlight && (
                    <p className="mt-2 text-[11px] text-muted-foreground/80 italic">Spotlight: {stageInsight.spotlight}</p>
                  )}
                </div>
              )}
              {prospects.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No prospects in this stage
                </div>
              ) : (
                <div>
                  {prospects.map(prospect => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      onClick={onProspectClick}
                      onGenerateProposal={onGenerateProposal}
                      onFinalizeProposal={onFinalizeProposal}
                      latestProposal={proposalInsights?.[prospect.id]}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <div
            className="flex items-center justify-between p-3 border-b border-border"
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${stageColor.bg}`}
              ></div>
              <h3 className="font-medium text-foreground">{title}</h3>
            </div>
            <span className="text-xs font-medium bg-background rounded-full px-2 py-0.5 text-foreground">
              {prospects.length}
            </span>
          </div>
          <CardContent className="p-3 h-[calc(100vh-240px)] overflow-auto">
            {stageInsight && (
              <div className="mb-3 rounded-md border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold uppercase tracking-wide">Next-stage readiness</span>
                  </div>
                  <span className="font-semibold text-primary">{stageInsight.likelihood}%</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{stageInsight.message}</p>
                {stageInsight.spotlight && (
                  <p className="mt-2 text-[11px] text-muted-foreground/80 italic">Spotlight: {stageInsight.spotlight}</p>
                )}
              </div>
            )}
            {prospects.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No prospects in this stage
              </div>
            ) : (
              <div>
                {prospects.map(prospect => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onClick={onProspectClick}
                    onGenerateProposal={onGenerateProposal}
                    onFinalizeProposal={onFinalizeProposal}
                    latestProposal={proposalInsights?.[prospect.id]}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

export default function Prospects() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeProspects, setActiveProspects] = useState<Prospect[]>([]);
  const [draggedItem, setDraggedItem] = useState<Prospect | null>(null);
  const [proposalInsights, setProposalInsights] = useState<Record<number, ProposalActionResult>>({});
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isGeneratingOverlayDraft, setIsGeneratingOverlayDraft] = useState(false);
  const [isFinalizingOverlay, setIsFinalizingOverlay] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minPotentialAum: 0,
    maxPotentialAum: 10000000,
    minProbabilityScore: 0,
    maxProbabilityScore: 100,
    includedStages: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  });

  useEffect(() => {
    document.title = "Prospects | Wealth RM";
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: prospects = [], isLoading } = useQuery<Prospect[]>({
    queryKey: ['/api/prospects'],
    queryFn: async () => {
      const response = await fetch('/api/prospects', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch prospects');
      }
      return response.json();
    }
  });

  const stages = useMemo(() => [
    { id: 'new', title: 'New' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'proposal', title: 'Proposal' },
    { id: 'negotiation', title: 'Negotiation' },
    { id: 'won', title: 'Won' },
    { id: 'lost', title: 'Lost' }
  ], []);

  const stageCount = stages.length;

  useEffect(() => {
    if (prospects) {
      const normalized = prospects.map(normalizeProspectRecord);
      setActiveProspects(normalized);
    }
  }, [prospects]);

  const calculateActiveFilters = useCallback(() => {
    let count = 0;

    if (filterOptions.minPotentialAum > 0) count++;
    if (filterOptions.maxPotentialAum < 10000000) count++;
    if (filterOptions.minProbabilityScore > 0) count++;
    if (filterOptions.maxProbabilityScore < 100) count++;
    if (filterOptions.includedStages.length < stageCount) count++;

    setActiveFilters(count);
  }, [filterOptions, stageCount]);

  useEffect(() => {
    calculateActiveFilters();
  }, [calculateActiveFilters]);

  useEffect(() => {
    if (!isOverlayOpen) {
      setIsGeneratingOverlayDraft(false);
      setIsFinalizingOverlay(false);
    }
  }, [isOverlayOpen]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const prospect = activeProspects.find(p => p.id === active.id);
    if (prospect) {
      setDraggedItem(prospect);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setActiveProspects(prospects => {
        const oldIndex = prospects.findIndex(p => p.id === active.id);
        const newIndex = prospects.findIndex(p => p.id === over.id);

        return arrayMove(prospects, oldIndex, newIndex);
      });
    }
  };

  const isMobile = useIsMobile();

  const filteredProspects = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return activeProspects.filter(prospect => {
      const searchSources = [
        prospect.fullName,
        prospect.email,
        prospect.phone,
        Array.isArray(prospect.productsOfInterest) ? prospect.productsOfInterest.join(' ') : prospect.productsOfInterest ?? '',
        prospect.notes ?? ''
      ];

      const matchesSearch = !normalizedSearch ||
        searchSources.some(value => value && value.toLowerCase().includes(normalizedSearch));

      const matchesStage = filterOptions.includedStages.includes((prospect.stage || '').toLowerCase());
      const potentialValue = prospect.potentialAumValue ?? 0;
      const matchesAum = potentialValue >= filterOptions.minPotentialAum && potentialValue <= filterOptions.maxPotentialAum;
      const probability = prospect.probabilityScore ?? 0;
      const matchesProbability = probability >= filterOptions.minProbabilityScore && probability <= filterOptions.maxProbabilityScore;

      return matchesSearch && matchesStage && matchesAum && matchesProbability;
    });
  }, [activeProspects, filterOptions, searchQuery]);

  const stageInsights = useMemo(() => {
    const insights: Record<string, StageInsight> = {};
    const stageOrder = stages.map(stage => stage.id);

    stageOrder.forEach((stageId, index) => {
      const stageProspects = filteredProspects.filter(prospect => (prospect.stage || '').toLowerCase() === stageId);

      if (stageProspects.length === 0) {
        insights[stageId] = {
          likelihood: 0,
          message: index === 0
            ? 'No leads yet. Add new prospects to keep the pipeline active.'
            : `No opportunities currently in ${STAGE_TITLES[stageId] || stageId}.`,
        };
        return;
      }

      const avgProbability = Math.round(
        stageProspects.reduce((sum, prospect) => sum + (prospect.probabilityScore ?? 0), 0) /
        stageProspects.length
      );
      const nextStageId = stageOrder[index + 1];
      const topProspect = stageProspects.reduce<Prospect | null>((best, current) => {
        const bestValue = best?.potentialAumValue ?? 0;
        const currentValue = current.potentialAumValue ?? 0;
        return currentValue > bestValue ? current : best;
      }, null);
      const spotlight = topProspect ? `${topProspect.fullName} • ${formatCurrency(topProspect.potentialAumValue || 0)}` : undefined;

      let message: string;
      if (!nextStageId) {
        if (stageId === 'won') {
          message = 'Celebrate wins and initiate onboarding or referral asks.';
        } else if (stageId === 'lost') {
          message = 'Review objections and queue targeted win-back cadences.';
        } else {
          message = 'Keep nurturing these relationships to maintain momentum.';
        }
      } else if (avgProbability >= 70) {
        message = `Deals look ready for ${STAGE_TITLES[nextStageId] || nextStageId}. Line up next-step meetings${topProspect ? ` starting with ${topProspect.fullName}` : ''}.`;
      } else if (avgProbability >= 40) {
        message = `Coach prospects toward ${STAGE_TITLES[nextStageId] || nextStageId}. Reinforce value drivers and clear blockers.`;
      } else {
        message = `Low readiness for ${STAGE_TITLES[nextStageId] || nextStageId}. Run discovery sessions and objection handling to warm leads.`;
      }

      insights[stageId] = {
        likelihood: avgProbability,
        message,
        spotlight,
      };
    });

    return insights;
  }, [filteredProspects, stages]);

  const selectedProspect = useMemo(() => {
    if (selectedProspectId === null) {
      return null;
    }
    return activeProspects.find(prospect => prospect.id === selectedProspectId) ?? null;
  }, [activeProspects, selectedProspectId]);

  const overlayStageInsight = selectedProspect ? stageInsights[selectedProspect.stage] : undefined;
  const personaBrief = useMemo(() => (selectedProspect ? buildPersonaBrief(selectedProspect) : null), [selectedProspect]);
  const latestProposal = selectedProspect ? proposalInsights[selectedProspect.id] : null;

  const handleOverlayDraft = async () => {
    if (!selectedProspect) return;
    try {
      setIsGeneratingOverlayDraft(true);
      await generateProposalDraft(selectedProspect.id);
    } catch (error) {
      // Errors are surfaced via toast in generateProposalDraft
    } finally {
      setIsGeneratingOverlayDraft(false);
    }
  };

  const handleOverlayFinalize = async () => {
    if (!selectedProspect) return;
    try {
      setIsFinalizingOverlay(true);
      await finalizeProposal(selectedProspect.id);
    } catch (error) {
      // Errors are surfaced via toast in finalizeProposal
    } finally {
      setIsFinalizingOverlay(false);
    }
  };

  const overlayStageStyles = selectedProspect ? getStageColor(selectedProspect.stage) : null;
  const overlayStageTitle = selectedProspect ? (STAGE_TITLES[(selectedProspect.stage || '').toLowerCase()] || selectedProspect.stage) : '';
  const overlayProducts = selectedProspect
    ? (Array.isArray(selectedProspect.productsOfInterest)
        ? selectedProspect.productsOfInterest
        : typeof selectedProspect.productsOfInterest === 'string'
          ? selectedProspect.productsOfInterest.split(',').map(item => item.trim()).filter(Boolean)
          : [])
    : [];
  const overlayLastContact = selectedProspect ? formatRelativeDate(selectedProspect.lastContactDate ?? null) : null;

  const generateProposalDraft = useCallback(async (prospectId: number) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/proposals/draft`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to generate draft proposal');
      }
      const result: ProposalActionResult = await response.json();
      setProposalInsights(prev => ({ ...prev, [prospectId]: result }));
      toast({ title: 'Draft proposal prepared', description: result.summary });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate proposal';
      toast({ title: 'Proposal generation failed', description: message, variant: 'destructive' });
      throw error;
    }
  }, [toast]);

  const finalizeProposal = useCallback(async (prospectId: number) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/proposals/finalize`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to finalize proposal');
      }
      const result: ProposalActionResult = await response.json();
      setProposalInsights(prev => ({ ...prev, [prospectId]: result }));
      toast({ title: 'Proposal finalized', description: result.summary });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize proposal';
      toast({ title: 'Proposal finalization failed', description: message, variant: 'destructive' });
      throw error;
    }
  }, [toast]);

  // Reset filters function
  const resetFilters = () => {
    setFilterOptions({
      minPotentialAum: 0,
      maxPotentialAum: 10000000,
      minProbabilityScore: 0,
      maxProbabilityScore: 100,
      includedStages: stages.map(stage => stage.id)
    });
  };
  
  // Export prospects to CSV
  const exportProspects = () => {
    if (!filteredProspects || filteredProspects.length === 0) return;
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Potential AUM', 'Probability Score', 'Stage', 'Last Contact', 'Products of Interest', 'Notes'];
    const rows = filteredProspects.map(p => [
      p.fullName,
      p.email || '',
      p.phone || '',
      p.potentialAum,
      p.probabilityScore != null ? `${p.probabilityScore}%` : '',
      STAGE_TITLES[(p.stage || '').toLowerCase()] || p.stage,
      p.lastContactDate || '',
      Array.isArray(p.productsOfInterest) ? p.productsOfInterest.join(' | ') : p.productsOfInterest || '',
      p.notes || ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prospects_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getProspectsByStage = (stage: string) => {
    return filteredProspects.filter(prospect => (prospect.stage || '').toLowerCase() === stage);
  };

  const handleProspectClick = (id: number) => {
    setSelectedProspectId(id);
    setIsOverlayOpen(true);
  };
  
  // Handle add prospect click
  const handleAddProspectClick = () => {
    window.location.hash = "/prospects/new";
  };
  
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-background transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-64 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        
        <div className="h-32 w-full bg-muted rounded animate-pulse mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, stageIndex) => (
            <div key={stageIndex} className="space-y-4">
              <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse ml-3"></div>
                    </div>
                    <div className="h-5 w-12 bg-muted rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-6 bg-background min-h-screen transition-colors duration-300">
        <div className="flex items-center justify-between mb-6 animate-in slide-in-from-top-4 duration-500">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Prospects</h1>
          <Button
            onClick={handleAddProspectClick}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Funnel Chart */}
        <FunnelChart prospects={filteredProspects} stages={stages} />

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search prospects..."
                className="pl-10 !bg-background !border-input !text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 relative !bg-background !border-input !text-foreground hover:!bg-muted/50">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                    {activeFilters > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {activeFilters}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filter Prospects</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs h-8 px-2"
                    >
                      Reset
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Potential AUM Range */}
                    <div>
                      <Label className="text-sm mb-2 block">Potential AUM Range</Label>
                      <div className="mt-6 px-2">
                        <Slider
                          value={[filterOptions.minPotentialAum, filterOptions.maxPotentialAum]}
                          max={10000000}
                          step={100000}
                          onValueChange={(values) => {
                            setFilterOptions(prev => ({
                              ...prev,
                              minPotentialAum: values[0],
                              maxPotentialAum: values[1]
                            }));
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{formatCurrency(filterOptions.minPotentialAum)}</span>
                        <span>{formatCurrency(filterOptions.maxPotentialAum)}</span>
                      </div>
                    </div>

                    {/* Probability Score Range */}
                    <div>
                      <Label className="text-sm mb-2 block">Probability Score Range</Label>
                      <div className="mt-6 px-2">
                        <Slider
                          value={[filterOptions.minProbabilityScore, filterOptions.maxProbabilityScore]}
                          max={100}
                          step={5}
                          onValueChange={(values) => {
                            setFilterOptions(prev => ({
                              ...prev,
                              minProbabilityScore: values[0],
                              maxProbabilityScore: values[1]
                            }));
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{filterOptions.minProbabilityScore}%</span>
                        <span>{filterOptions.maxProbabilityScore}%</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Stages */}
                    <div>
                      <Label className="text-sm mb-2 block">Stages</Label>
                      <div className="space-y-2 mt-2">
                        {stages.map(stage => (
                          <div className="flex items-center space-x-2" key={stage.id}>
                            <Checkbox
                              id={`stage-${stage.id}`}
                              checked={filterOptions.includedStages.includes(stage.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilterOptions(prev => ({
                                    ...prev,
                                    includedStages: [...prev.includedStages, stage.id]
                                  }));
                                } else {
                                  setFilterOptions(prev => ({
                                    ...prev,
                                    includedStages: prev.includedStages.filter(s => s !== stage.id)
                                  }));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`stage-${stage.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {stage.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={exportProspects}
                className="flex items-center gap-2 !bg-background !border-input !text-foreground hover:!bg-muted/50"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {filteredProspects.length === 0 ? (
          <div className="bg-card p-6 rounded-md shadow-sm border border-border text-center">
            <p className="text-muted-foreground mb-4">No prospects match your search criteria</p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          isMobile ? (
            <div className="space-y-4">
              {stages.map(stage => (
                <PipelineColumn
                  key={stage.id}
                  title={stage.title}
                  prospects={getProspectsByStage(stage.id)}
                  stage={stage.id}
                  onProspectClick={handleProspectClick}
                  isMobile={true}
                  stageInsight={stageInsights[stage.id]}
                  onGenerateProposal={generateProposalDraft}
                  onFinalizeProposal={finalizeProposal}
                  proposalInsights={proposalInsights}
                />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {stages.map(stage => (
                  <PipelineColumn
                    key={stage.id}
                    title={stage.title}
                    prospects={getProspectsByStage(stage.id)}
                    stage={stage.id}
                    onProspectClick={handleProspectClick}
                    stageInsight={stageInsights[stage.id]}
                    onGenerateProposal={generateProposalDraft}
                    onFinalizeProposal={finalizeProposal}
                    proposalInsights={proposalInsights}
                  />
                ))}
              </div>
              <DragOverlay>
                {draggedItem ? (
                  <div className="w-72">
                    <ProspectCard
                      prospect={draggedItem}
                      onClick={() => {}}
                      latestProposal={proposalInsights?.[draggedItem.id]}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )
        )}
      </div>

      <Dialog
        open={isOverlayOpen}
        onOpenChange={(open) => {
          setIsOverlayOpen(open);
          if (!open) {
            setSelectedProspectId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedProspect ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 text-left text-foreground">
                  {selectedProspect.fullName}
                  {overlayStageStyles && overlayStageTitle && (
                    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white ${overlayStageStyles.bg}`}>
                      {overlayStageTitle}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  <span>Potential {selectedProspect.potentialAumValue != null ? formatCurrency(selectedProspect.potentialAumValue) : selectedProspect.potentialAum || 'Not specified'}</span>
                  <span className="mx-1">•</span>
                  <span>Probability {(selectedProspect.probabilityScore ?? 0)}%</span>
                  {selectedProspect.email && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{selectedProspect.email}</span>
                    </>
                  )}
                  {selectedProspect.phone && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{selectedProspect.phone}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <ScrollArea className="max-h-[60vh] pr-2">
                  <div className="space-y-4">
                    <Card className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-foreground">Opportunity snapshot</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Potential AUM</span>
                          <span className="font-semibold text-foreground">
                            {selectedProspect.potentialAumValue != null ? formatCurrency(selectedProspect.potentialAumValue) : selectedProspect.potentialAum || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Probability score</span>
                          <span className="font-semibold text-foreground">{selectedProspect.probabilityScore ?? 0}%</span>
                        </div>
                        {overlayProducts.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Products of interest</p>
                            <p className="mt-1 text-sm text-foreground">{overlayProducts.join(', ')}</p>
                          </div>
                        )}
                        {selectedProspect.notes && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Notes</p>
                            <p className="mt-1 text-sm text-foreground leading-relaxed">{selectedProspect.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                          Proposal workspace
                          {latestProposal && (
                            <span
                              className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                latestProposal.status === 'draft'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {latestProposal.status}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        {latestProposal ? (
                          <div className="space-y-3">
                            <p>{latestProposal.summary}</p>
                            {(latestProposal.recommendedProducts?.length ?? 0) > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Recommended solutions</p>
                                <ul className="mt-1 space-y-1.5">
                                  {latestProposal.recommendedProducts.map(product => (
                                    <li key={product} className="flex items-start gap-2 text-sm text-foreground">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                      <span>{product}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(latestProposal.followUpActions?.length ?? 0) > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Next recommended actions</p>
                                <ul className="mt-1 space-y-1.5">
                                  {latestProposal.followUpActions.map(action => (
                                    <li key={action} className="flex items-start gap-2 text-sm text-foreground">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {latestProposal.confidence != null && (
                                <span className="font-medium text-primary">{latestProposal.confidence}% confidence</span>
                              )}
                              {latestProposal.generatedAt && (
                                <span>Generated {formatRelativeDate(latestProposal.generatedAt)}</span>
                              )}
                              {latestProposal.nextMilestone && (
                                <span>Next milestone: {latestProposal.nextMilestone}</span>
                              )}
                              {latestProposal.potentialValue != null && (
                                <span>Value: {formatCurrency(latestProposal.potentialValue)}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p>Spin up an AI-assisted proposal draft to personalize outreach and coaching.</p>
                            <p className="text-xs text-muted-foreground/80">Use the actions below to create or finalize a proposal for this relationship.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>

                <div className="space-y-4">
                  {overlayStageInsight && (
                    <Card className="border-border bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <span className="flex items-center gap-2 text-foreground">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Next-stage readiness
                          </span>
                          <span className="text-sm font-semibold text-primary">{overlayStageInsight.likelihood}%</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                        <p>{overlayStageInsight.message}</p>
                        {overlayStageInsight.spotlight && (
                          <p className="text-xs italic text-muted-foreground/80">Spotlight: {overlayStageInsight.spotlight}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {personaBrief && (
                    <Card className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                          Persona brief
                          <span className="text-xs font-medium text-primary">{personaBrief.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>{personaBrief.summary}</p>
                        {personaBrief.motivators.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Motivators</p>
                            <ul className="mt-1 space-y-1.5">
                              {personaBrief.motivators.map(motivator => (
                                <li key={motivator} className="flex items-start gap-2 text-sm text-foreground">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                  <span>{motivator}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {personaBrief.engagementTips.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Engagement tips</p>
                            <ul className="mt-1 space-y-1.5">
                              {personaBrief.engagementTips.map(tip => (
                                <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
                                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Last interaction: {overlayLastContact ?? 'N/A'}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleOverlayDraft}
                    disabled={isGeneratingOverlayDraft || isFinalizingOverlay}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingOverlayDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {isGeneratingOverlayDraft ? 'Preparing draft...' : 'Generate draft'}
                  </Button>
                  <Button
                    onClick={handleOverlayFinalize}
                    disabled={isFinalizingOverlay}
                    className="flex items-center gap-2"
                  >
                    {isFinalizingOverlay ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isFinalizingOverlay ? 'Finalizing...' : 'Finalize proposal'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Select a prospect to view persona guidance and proposal insights.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
