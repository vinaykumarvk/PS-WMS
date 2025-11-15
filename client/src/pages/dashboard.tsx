import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useUserPreferences } from "@/context/preferences-context";
import { useQuery } from "@tanstack/react-query";
import { ActionItemsPriorities } from "@/components/dashboard/action-items-priorities";
import { TalkingPointsCard } from "@/components/dashboard/talking-points-card";
import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { BusinessSnapshotStructured } from "@/components/dashboard/business-snapshot-structured";
import { GoalsVsActualsRibbon } from "@/components/dashboard/goals-vs-actuals-ribbon";
import { TodaysBriefingTimeline } from "@/components/dashboard/todays-briefing-timeline";
import { OpportunityHighlights } from "@/components/dashboard/opportunity-highlights";
import { RelationshipInsights } from "@/components/dashboard/relationship-insights";
import { CoachingNudgesCard } from "@/components/dashboard/coaching-nudges-card";
import { ScenarioToggles } from "@/components/dashboard/scenario-toggles";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { FadeIn, PageTransition } from "@/components/animations";
import {
  BusinessSnapshotSkeleton,
  ActionItemsSkeleton,
  TalkingPointsSkeleton,
  AnnouncementsSkeleton,
  PerformanceSkeleton
} from "@/components/ui/dashboard-skeleton";
import { GenerativeBriefingCard } from "@/components/dashboard/generative-briefing-card";
import { useActionItemOrchestration } from "@/services/action-item-orchestrator";
import { useDashboardBriefing } from "@/services/dashboard-briefing";

import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const {
    data: actionItems,
    isLoading: actionItemsLoading,
    refetch: refetchActionItems
  } = useActionItemOrchestration();
  const {
    data: briefing,
    isLoading: briefingLoading,
    refetch: refetchBriefing
  } = useDashboardBriefing(preferences);
  
  // Set page title
  useEffect(() => {
    document.title = "Dashboard | Wealth RM";
  }, []);

  // Fetch all critical dashboard data to coordinate loading
  const { isLoading: businessMetricsLoading } = useQuery({
    queryKey: ['/api/business-metrics/1'],
    staleTime: 0,
    refetchOnMount: true
  });

  const { isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/performance']
  });

  // Additional queries for new components
  const { isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments/today']
  });

  const { isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/portfolio-alerts']
  });

  const { isLoading: prospectsLoading } = useQuery({
    queryKey: ['/api/prospects']
  });

  const { isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients']
  });

  // Show skeleton loading until all critical data is loaded
  const isLoading =
    businessMetricsLoading ||
    performanceLoading ||
    actionItemsLoading ||
    briefingLoading ||
    appointmentsLoading ||
    alertsLoading ||
    prospectsLoading ||
    clientsLoading;

  const firstName = useMemo(() => user?.fullName.split(' ')[0] ?? 'there', [user?.fullName]);
  const greetingLine = useMemo(() => {
    switch (preferences.tone) {
      case 'friendly':
        return `Hey ${firstName}!`;
      case 'direct':
        return `${firstName}, let's get to it.`;
      default:
        return `Good day, ${firstName}`;
    }
  }, [firstName, preferences.tone]);

  const depthDescriptor = useMemo(() => {
    switch (preferences.depth) {
      case 'concise':
        return 'Quick snapshot curated to keep you on the front foot.';
      case 'comprehensive':
        return 'Expanded intelligence assembled for a deep dive across your book.';
      default:
        return 'Balanced briefing tuned for your daily rhythm.';
    }
  }, [preferences.depth]);

  const handleBriefingRefresh = () => {
    refetchBriefing();
    refetchActionItems();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Page Header Skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-80 bg-muted rounded animate-pulse"></div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Business Snapshot Skeleton */}
          <BusinessSnapshotSkeleton />
          
          {/* Grid Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
            {/* Action Items Skeleton */}
            <div className="lg:col-span-5 xl:col-span-4">
              <ActionItemsSkeleton />
            </div>
            
            {/* Talking Points & Announcements Skeleton */}
            <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <TalkingPointsSkeleton />
              <AnnouncementsSkeleton />
            </div>
          </div>
          
          {/* Performance Skeleton */}
          <PerformanceSkeleton />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Enhanced Page Header with Better Typography */}
          <FadeIn direction="down" delay={0} duration={500}>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                {greetingLine}
              </h1>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {depthDescriptor}
                  </p>
                </div>
                <div className="transition-transform duration-200 hover:scale-105">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="animate-in fade-in duration-500 delay-200">
            <GenerativeBriefingCard
              briefing={briefing}
              isLoading={briefingLoading}
              onRefresh={handleBriefingRefresh}
            />
          </div>

          {/* Enhanced Responsive Grid Layout with Better Spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          {/* Action Items Section - Optimized proportions with enhanced animation */}
          <div className="lg:col-span-5 xl:col-span-4 animate-in slide-in-from-left-4 duration-700 delay-300">
            <div className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              <ActionItemsPriorities data={actionItems} isLoading={actionItemsLoading} />
            </div>
          </div>
          {/* NEW NARRATIVE LAYOUT: RM's Daily Storyline */}
          
          {/* 1. Top Ribbon: Goals vs Actuals */}
          <FadeIn direction="down" delay={100} duration={500}>
            <GoalsVsActualsRibbon />
          </FadeIn>

          {/* Scenario Toggles - Filter dashboard views */}
          <FadeIn direction="down" delay={150} duration={500}>
            <ScenarioToggles />
          </FadeIn>

          {/* 2. Today's Briefing Timeline - Main focus area */}
          <FadeIn direction="up" delay={200} duration={500}>
            <TodaysBriefingTimeline />
          </FadeIn>

          {/* 3. Opportunity Highlights */}
          <FadeIn direction="up" delay={300} duration={500}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpportunityHighlights />
              <RelationshipInsights />
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={320} duration={500}>
            <CoachingNudgesCard />
          </FadeIn>

          {/* 4. Market Insights & Updates - Secondary information */}
          <FadeIn direction="up" delay={400} duration={500}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TalkingPointsCard />
              <AnnouncementsCard />
            </div>
          </FadeIn>

          {/* 5. Business Snapshot & Performance - Detailed metrics */}
          <FadeIn direction="up" delay={500} duration={500}>
            <BusinessSnapshotStructured />
          </FadeIn>

          <FadeIn direction="up" delay={600} duration={500}>
            <PerformanceCard />
          </FadeIn>
        
          {/* Additional spacing for mobile scroll with better padding */}
          <div className="pb-8 sm:pb-12 lg:pb-16"></div>
        </div>
      </div>
    </div>
  </PageTransition>
  );
}
