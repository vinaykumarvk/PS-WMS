import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Calendar, MessageSquare, AlertCircle, ArrowRight, Heart, Activity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useDashboardFilters } from "@/context/dashboard-filter-context";
import { QuickActionsWorkflow } from "./quick-actions-workflow";
import {
  calculateRelationshipHealth,
  summarizeRelationshipHealth,
  getRelationshipHealthStatusMeta,
  type RelationshipHealthRecord,
  type RelationshipHealthStatusMeta,
} from "@/utils/relationship-health";

interface RelationshipInsight {
  id: number;
  clientName: string;
  clientId: number;
  aum: number;
  lastContactDate?: string;
  nextReviewDate?: string;
  riskProfile?: string;
  tier?: string;
  activityLevel: 'high' | 'medium' | 'low';
  needsAttention: boolean;
  milestone?: string;
  hasExpiringKYC?: boolean;
  expiryDate?: string;
  healthScore: number;
  healthStatus: RelationshipHealthRecord["status"];
  healthLabel: string;
  healthTone: RelationshipHealthStatusMeta["tone"];
  healthNarrative?: string;
}

interface RelationshipInsightsProps {
  className?: string;
  maxItems?: number;
}

const HEALTH_TONE_STYLES: Record<RelationshipHealthStatusMeta["tone"], { badge: string; bar: string; text: string }> = {
  positive: {
    badge: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  neutral: {
    badge: "border-sky-500 text-sky-600 dark:text-sky-400",
    bar: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
  },
  caution: {
    badge: "border-amber-500 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    badge: "border-red-500 text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
};

const DEFAULT_HEALTH_STYLE = {
  badge: "border-border text-muted-foreground",
  bar: "bg-muted-foreground/40",
  text: "text-foreground",
};

export function RelationshipInsights({ className, maxItems = 5 }: RelationshipInsightsProps) {
  const [, navigate] = useLocation();
  const { hasFilter } = useDashboardFilters();
  
  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch appointments for last contact dates
  const { data: appointments, isLoading: appointmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => fetch('/api/tasks').then((res) => res.json()),
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: ['/api/portfolio-alerts'],
    queryFn: () => fetch('/api/portfolio-alerts').then((res) => res.json()),
  });

  const isLoading = clientsLoading || appointmentsLoading || tasksLoading || alertsLoading;

  const healthRecords = useMemo<RelationshipHealthRecord[]>(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    return safeClients.map((client: any) =>
      calculateRelationshipHealth(client, { tasks, appointments, alerts })
    );
  }, [clients, tasks, appointments, alerts]);

  const healthSummary = useMemo(() => summarizeRelationshipHealth(healthRecords), [healthRecords]);

  const healthMap = useMemo(() => new Map(healthRecords.map((record) => [record.clientId, record])), [healthRecords]);
  
  // Helper function to check if KYC is expiring (within 30 days)
  const checkKYCExpiry = (expiryDate: string | null | undefined): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30; // Expiring within 30 days
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'gold':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'silver':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
    }
  };

  // Calculate relationship insights
  const getRelationshipInsights = (): RelationshipInsight[] => {
    const insights: RelationshipInsight[] = [];
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    
    // Group appointments by client
    const appointmentsByClient = safeAppointments.reduce((acc: Record<number, any[]>, apt: any) => {
      const clientId = apt.clientId;
      if (clientId) {
        if (!acc[clientId]) acc[clientId] = [];
        acc[clientId].push(apt);
      }
      return acc;
    }, {});

    safeClients.forEach((client: any) => {
      const clientId = client.id;
      const clientAppointments = appointmentsByClient[clientId] || [];

      // Find most recent appointment
      const lastAppointment = clientAppointments
        .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
      
      const lastContactDate = lastAppointment?.startTime;
      const daysSinceContact = lastContactDate 
        ? Math.floor((Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Determine activity level
      let activityLevel: 'high' | 'medium' | 'low' = 'medium';
      if (clientAppointments.length >= 3 && daysSinceContact < 30) {
        activityLevel = 'high';
      } else if (daysSinceContact > 60 || clientAppointments.length === 0) {
        activityLevel = 'low';
      }
      
      const health = healthMap.get(clientId);

      // Check if needs attention (no contact in 60+ days or low activity)
      const derivedNeedsAttention = daysSinceContact > 60 || activityLevel === 'low';
      const needsAttention = health
        ? health.status === 'at-risk' || health.status === 'watch'
        : derivedNeedsAttention;

      const healthMeta = health ? getRelationshipHealthStatusMeta(health.status) : undefined;
      const healthNarrative = health?.recommendedFocus ?? health?.risks[0] ?? health?.strengths[0];

      // Calculate next review date (90 days from last contact or client since date)
      const nextReviewDate = lastContactDate
        ? new Date(new Date(lastContactDate).getTime() + 90 * 24 * 60 * 60 * 1000)
        : client.clientSince
          ? new Date(new Date(client.clientSince).getTime() + 90 * 24 * 60 * 60 * 1000)
          : undefined;
      
      // Check for milestones (anniversary, etc.)
      let milestone: string | undefined;
      if (client.clientSince) {
        const clientSince = new Date(client.clientSince);
        const yearsSince = Math.floor((Date.now() - clientSince.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const nextAnniversary = new Date(clientSince);
        nextAnniversary.setFullYear(new Date().getFullYear());
        if (nextAnniversary < new Date()) {
          nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
        }
        const daysToAnniversary = Math.ceil((nextAnniversary.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToAnniversary <= 30) {
          milestone = `${yearsSince + 1}-year anniversary`;
        }
      }

      // Check for expiring KYC (risk profile expiry)
      // Note: This would ideally come from risk_assessment table, but for now we'll check if available in client data
      const expiryDate = client.riskProfileExpiryDate || client.risk_profile_expiry_date || null;
      const hasExpiringKYC = checkKYCExpiry(expiryDate);

      insights.push({
        id: clientId,
        clientName: client.fullName || client.name || 'Unknown Client',
        clientId: clientId,
        aum: client.totalAum || client.aum || 0,
        lastContactDate: lastContactDate,
        nextReviewDate: nextReviewDate?.toISOString(),
        riskProfile: client.riskProfile || client.risk_profile,
        tier: client.tier || 'Standard',
        activityLevel,
        needsAttention,
        milestone,
        hasExpiringKYC,
        expiryDate: expiryDate || undefined,
        healthScore: health?.score ?? 60,
        healthStatus: health?.status ?? 'watch',
        healthLabel: health?.statusLabel ?? 'Watch',
        healthTone: healthMeta ? healthMeta.tone : 'neutral',
        healthNarrative,
      });
    });

    // Apply filters
    let filteredInsights = insights;
    
    // Filter by expiring KYC
    if (hasFilter('expiring-kyc')) {
      filteredInsights = filteredInsights.filter(insight => insight.hasExpiringKYC);
    }
    
    // Filter by clients needing attention
    if (hasFilter('clients-needing-attention')) {
      filteredInsights = filteredInsights.filter(insight => insight.needsAttention);
    }
    
    // Filter by upcoming reviews (within 7 days)
    if (hasFilter('upcoming-reviews')) {
      filteredInsights = filteredInsights.filter(insight => {
        if (!insight.nextReviewDate) return false;
        const daysUntilReview = Math.ceil(
          (new Date(insight.nextReviewDate).getTime() - Date.now()) / 
          (1000 * 60 * 60 * 24)
        );
        return daysUntilReview <= 7 && daysUntilReview >= 0;
      });
    }

    // Sort by: needs attention first, then by AUM, then by activity level
    return filteredInsights
      .sort((a, b) => {
        if (a.needsAttention !== b.needsAttention) {
          return a.needsAttention ? -1 : 1;
        }
        if (a.healthScore !== b.healthScore) {
          return a.healthScore - b.healthScore;
        }
        if (b.aum !== a.aum) {
          return b.aum - a.aum;
        }
        const activityOrder = { high: 3, medium: 2, low: 1 };
        return activityOrder[b.activityLevel] - activityOrder[a.activityLevel];
      })
      .slice(0, maxItems);
  };

  const insights = getRelationshipInsights();

  if (isLoading) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardHeader>
          <CardTitle>Relationship Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(maxItems)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle>Relationship Insights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clients')}
            className="text-xs"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Client relationships that need your attention
        </p>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No client insights available</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Average Score</div>
                <div className="text-lg font-semibold text-foreground">{healthSummary.averageScore}</div>
                <div className="text-[11px] text-muted-foreground">{healthSummary.dominantStatusLabel}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">At Risk</div>
                <div className="text-lg font-semibold text-foreground">{healthSummary.distribution['at-risk']}</div>
                <div className="text-[11px] text-muted-foreground">Watchlist {healthSummary.distribution['watch']}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Top Signal</div>
                <div className="text-sm font-semibold text-foreground">
                  {healthSummary.risks[0]?.label ?? 'Engagement steady'}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {healthSummary.risks[0] ? `${healthSummary.risks[0].count} clients impacted` : 'Maintain momentum'}
                </div>
              </div>
            </div>

            {insights.map((insight) => {
              const daysSinceContact = insight.lastContactDate
                ? Math.floor((Date.now() - new Date(insight.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const toneStyles = HEALTH_TONE_STYLES[insight.healthTone] ?? DEFAULT_HEALTH_STYLE;
              const healthWidth = Math.max(6, Math.min(Math.round(insight.healthScore), 100));

              return (
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                    insight.needsAttention && "border-yellow-500/30 bg-yellow-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">
                          {insight.clientName}
                        </h4>
                        <Badge className={cn("text-xs", getTierColor(insight.tier))}>
                          {insight.tier}
                        </Badge>
                        <Badge className={cn("text-xs", getActivityColor(insight.activityLevel))}>
                          <Activity className="h-3 w-3 mr-1" />
                          {insight.activityLevel.charAt(0).toUpperCase() + insight.activityLevel.slice(1)} Activity
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", toneStyles.badge)}
                        >
                          Health {Math.round(insight.healthScore)}
                        </Badge>
                        {insight.needsAttention && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Attention
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">AUM:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            {formatCurrency(insight.aum)}
                          </span>
                        </div>
                        {insight.riskProfile && (
                          <div>
                            <span className="text-muted-foreground">Risk:</span>
                            <span className="ml-2 font-semibold text-foreground capitalize">
                              {insight.riskProfile}
                            </span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs">Health</span>
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className={toneStyles.text}>{insight.healthLabel}</span>
                            <span className="text-muted-foreground">{Math.round(insight.healthScore)} / 100</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full", toneStyles.bar)} style={{ width: `${healthWidth}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {daysSinceContact !== null && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {daysSinceContact === 0
                              ? 'Contacted today'
                              : daysSinceContact === 1
                                ? 'Contacted yesterday'
                                : `${daysSinceContact} days ago`
                            }
                          </span>
                        )}
                        {insight.nextReviewDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Review: {format(new Date(insight.nextReviewDate), "MMM dd")}
                          </span>
                        )}
                        {insight.healthNarrative && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            {insight.healthNarrative}
                          </span>
                        )}
                        {insight.milestone && (
                          <span className="flex items-center gap-1 text-primary">
                            <TrendingUp className="h-3 w-3" />
                            {insight.milestone}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <QuickActionsWorkflow
                        context={{
                          clientId: insight.clientId,
                          clientName: insight.clientName,
                          type: 'client',
                        }}
                        variant="icon"
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/clients/${insight.clientId}`)}
                        className="shrink-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

