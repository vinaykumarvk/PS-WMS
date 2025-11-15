import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, IndianRupee, Target, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GoalMetric {
  label: string;
  actual: number;
  target: number;
  unit: 'currency' | 'number' | 'percentage';
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface GoalsVsActualsRibbonProps {
  className?: string;
}

export function GoalsVsActualsRibbon({ className }: GoalsVsActualsRibbonProps) {
  // Fetch business metrics
  const { data: businessMetrics, isLoading: businessLoading } = useQuery({
    queryKey: ['/api/business-metrics/1'],
    staleTime: 0,
    refetchOnMount: true
  });

  // Fetch performance data with targets
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/performance'],
  });

  // Fetch prospects for pipeline value
  const { data: prospects, isLoading: prospectsLoading } = useQuery({
    queryKey: ['/api/prospects'],
  });

  const isLoading = businessLoading || performanceLoading || prospectsLoading;

  // Format currency values
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) { // 1 Crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 Lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  // Calculate metrics from API data
  const calculateMetrics = (): GoalMetric[] => {
    const totalAum = businessMetrics?.totalAum || 0;
    const totalClients = businessMetrics?.totalClients || 0;
    const revenueMTD = businessMetrics?.revenueMonthToDate || 0;
    
    // Calculate pipeline value from prospects
    const pipelineValue = prospects?.reduce((total: number, prospect: any) => {
      return total + (prospect.potentialAumValue || prospect.potential_aum_value || 0);
    }, 0) || 0;

    // Get targets from performance data (defaults if not available)
    const targets = performance?.targets || [];
    const newClientsTarget = targets.find((t: any) => t.name === "New Clients")?.target || 0;
    const newClientsAchieved = targets.find((t: any) => t.name === "New Clients")?.achieved || 0;
    
    // For AUM, use a reasonable target based on current AUM (can be enhanced with actual targets)
    const aumTarget = totalAum * 1.15; // 15% growth target (placeholder)
    
    // For revenue, use performance target if available
    const revenueTarget = targets.find((t: any) => t.name === "Revenue")?.target || revenueMTD * 1.2;
    
    // For pipeline, use performance target if available
    const pipelineTarget = targets.find((t: any) => t.name === "Prospect Pipeline")?.target || pipelineValue * 1.25;

    return [
      {
        label: "AUM",
        actual: totalAum,
        target: aumTarget,
        unit: 'currency',
        icon: <IndianRupee className="h-4 w-4" />,
        priority: 'high'
      },
      {
        label: "New Clients",
        actual: newClientsAchieved,
        target: newClientsTarget || totalClients * 0.1, // 10% growth if no target
        unit: 'number',
        icon: <Users className="h-4 w-4" />,
        priority: 'high'
      },
      {
        label: "Revenue MTD",
        actual: revenueMTD,
        target: revenueTarget,
        unit: 'currency',
        icon: <Target className="h-4 w-4" />,
        priority: 'medium'
      },
      {
        label: "Pipeline",
        actual: pipelineValue,
        target: pipelineTarget,
        unit: 'currency',
        icon: <TrendingUp className="h-4 w-4" />,
        priority: 'medium'
      }
    ];
  };

  const getProgress = (actual: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const getStatus = (progress: number): 'on-track' | 'at-risk' | 'behind' => {
    if (progress >= 90) return 'on-track';
    if (progress >= 70) return 'at-risk';
    return 'behind';
  };

  const formatValue = (value: number, unit: 'currency' | 'number' | 'percentage'): string => {
    if (unit === 'currency') {
      return formatCurrency(value);
    }
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = calculateMetrics();

  return (
    <Card className={cn("mb-6 border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Goals vs Actuals</h2>
            <p className="text-sm text-muted-foreground">Your performance against targets</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const progress = getProgress(metric.actual, metric.target);
            const status = getStatus(progress);
            const percentage = Math.round(progress);

            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                  status === 'on-track' && "border-green-500/30 bg-green-500/5",
                  status === 'at-risk' && "border-yellow-500/30 bg-yellow-500/5",
                  status === 'behind' && "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded",
                      status === 'on-track' && "bg-green-500/10 text-green-600 dark:text-green-400",
                      status === 'at-risk' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                      status === 'behind' && "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                  </div>
                  {status === 'on-track' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {status === 'at-risk' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                  {status === 'behind' && <AlertCircle className="h-4 w-4 text-red-600" />}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {formatValue(metric.actual, metric.unit)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {formatValue(metric.target, metric.unit)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={progress} 
                      className={cn(
                        "h-2",
                        status === 'on-track' && "[&>div]:bg-green-500",
                        status === 'at-risk' && "[&>div]:bg-yellow-500",
                        status === 'behind' && "[&>div]:bg-red-500"
                      )}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(
                        "font-medium",
                        status === 'on-track' && "text-green-600 dark:text-green-400",
                        status === 'at-risk' && "text-yellow-600 dark:text-yellow-400",
                        status === 'behind' && "text-red-600 dark:text-red-400"
                      )}>
                        {percentage}% complete
                      </span>
                      {status === 'behind' && (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {formatValue(metric.target - metric.actual, metric.unit)} to go
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

