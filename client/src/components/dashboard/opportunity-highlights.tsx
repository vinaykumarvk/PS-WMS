import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, UserPlus, ArrowRight, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useDashboardFilters } from "@/context/dashboard-filter-context";
import { QuickActionsWorkflow } from "./quick-actions-workflow";

interface Opportunity {
  id: number;
  clientName: string;
  stage: string;
  expectedAmount: number;
  expectedCloseDate: string;
  probabilityScore: number;
  potentialAumValue?: number;
}

interface OpportunityHighlightsProps {
  className?: string;
  maxItems?: number;
}

export function OpportunityHighlights({ className, maxItems = 5 }: OpportunityHighlightsProps) {
  const [, navigate] = useLocation();
  const { hasFilter } = useDashboardFilters();
  
  // Fetch prospects
  const { data: prospects, isLoading: prospectsLoading } = useQuery({
    queryKey: ['/api/prospects'],
  });
  
  // Fetch deal closures
  const { data: closures, isLoading: closuresLoading } = useQuery({
    queryKey: ['/api/action-items/deal-closures'],
  });

  const isLoading = prospectsLoading || closuresLoading;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'qualified':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'proposal':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
      case 'won':
        return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  // Combine prospects and closures, sort by value/probability
  const getTopOpportunities = (): Opportunity[] => {
    const opportunities: Opportunity[] = [];
    
    // Add prospects
    const safeProspects = Array.isArray(prospects) ? prospects : [];
    const highValueThreshold = 10000000; // ₹1Cr
    
    safeProspects
      .filter((p: any) => {
        // Filter by stage
        if (!['new', 'qualified', 'proposal'].includes(p.stage)) return false;
        
        // If high-value-opportunities filter is active, show only high-value prospects
        if (hasFilter('high-value-opportunities')) {
          const value = p.potentialAumValue || p.potential_aum_value || 0;
          return value >= highValueThreshold;
        }
        
        return true;
      })
      .forEach((prospect: any) => {
        opportunities.push({
          id: prospect.id,
          clientName: prospect.fullName || prospect.client_name || 'Unknown',
          stage: prospect.stage,
          expectedAmount: prospect.potentialAumValue || prospect.potential_aum_value || 0,
          expectedCloseDate: prospect.lastContactDate || new Date().toISOString(),
          probabilityScore: prospect.probabilityScore || prospect.probability_score || 50,
          potentialAumValue: prospect.potentialAumValue || prospect.potential_aum_value
        });
      });
    
    // Add deal closures
    const safeClosures = Array.isArray(closures) ? closures : [];
    safeClosures.forEach((closure: any) => {
      opportunities.push({
        id: `closure-${closure.id}`,
        clientName: closure.client_name || 'Unknown',
        stage: 'proposal',
        expectedAmount: closure.expected_amount || 0,
        expectedCloseDate: closure.expected_close_date,
        probabilityScore: 80, // High probability for closures
      });
    });
    
    // Sort by value * probability, then by expected close date
    return opportunities
      .sort((a, b) => {
        const scoreA = a.expectedAmount * (a.probabilityScore / 100);
        const scoreB = b.expectedAmount * (b.probabilityScore / 100);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime();
      })
      .slice(0, maxItems);
  };

  const opportunities = getTopOpportunities();

  if (isLoading) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardHeader>
          <CardTitle>Opportunity Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(maxItems)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
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
            <CardTitle>Opportunity Highlights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/prospects')}
            className="text-xs"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Top opportunities ranked by value and probability
        </p>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No active opportunities</p>
            <p className="text-sm">Start building your pipeline</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => {
              const expectedDate = new Date(opp.expectedCloseDate);
              const daysUntilClose = Math.ceil((expectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUpcoming = daysUntilClose <= 7 && daysUntilClose >= 0;
              
              return (
                <div
                  key={opp.id}
                  className={cn(
                    "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                    isUpcoming && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {opp.clientName}
                        </h4>
                        <Badge className={cn("text-xs", getStageColor(opp.stage))}>
                          {getStageLabel(opp.stage)}
                        </Badge>
                        {isUpcoming && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Closing Soon
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            {formatCurrency(opp.expectedAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Probability:</span>
                          <span className="ml-2 font-semibold text-foreground">
                            {opp.probabilityScore}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(expectedDate, "MMM dd, yyyy")}
                        </span>
                        {daysUntilClose >= 0 && (
                          <span>
                            {daysUntilClose === 0 
                              ? 'Today' 
                              : daysUntilClose === 1 
                                ? 'Tomorrow' 
                                : `${daysUntilClose} days`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <QuickActionsWorkflow
                        context={{
                          prospectId: typeof opp.id === 'string' && opp.id.startsWith('closure-') ? undefined : (typeof opp.id === 'number' ? opp.id : undefined),
                          prospectName: opp.clientName,
                          type: 'prospect',
                        }}
                        variant="icon"
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/prospects`)}
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

