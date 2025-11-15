import { useDashboardFilters, ScenarioFilter } from "@/context/dashboard-filter-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  AlertTriangle,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioToggle {
  id: ScenarioFilter;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const scenarios: ScenarioToggle[] = [
  {
    id: 'expiring-kyc',
    label: 'Expiring KYC',
    description: 'Clients with risk profiles expiring within 30 days',
    icon: <FileCheck className="h-4 w-4" />,
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
  },
  {
    id: 'overdue-tasks',
    label: 'Overdue Tasks',
    description: 'Tasks past their due date',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
  },
  {
    id: 'high-value-opportunities',
    label: 'High-Value Opportunities',
    description: 'Prospects with potential AUM > ₹1Cr',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
  },
  {
    id: 'clients-needing-attention',
    label: 'Needs Attention',
    description: 'Clients with low activity or no recent contact',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
  },
  {
    id: 'upcoming-reviews',
    label: 'Upcoming Reviews',
    description: 'Clients with reviews scheduled in next 7 days',
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'critical-alerts',
    label: 'Critical Alerts',
    description: 'High priority portfolio alerts',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
  }
];

interface ScenarioTogglesProps {
  className?: string;
}

export function ScenarioToggles({ className }: ScenarioTogglesProps) {
  const { activeFilters, toggleFilter, clearFilters, filterCount } = useDashboardFilters();

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Scenario Filters</h3>
            <p className="text-xs text-muted-foreground">
              Filter dashboard to focus on specific scenarios
            </p>
          </div>
          {filterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Clear ({filterCount})
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => {
            const isActive = activeFilters.has(scenario.id);
            
            return (
              <Button
                key={scenario.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(scenario.id)}
                className={cn(
                  "h-auto py-2 px-3 text-xs font-medium transition-all",
                  isActive && scenario.color,
                  !isActive && "hover:bg-muted"
                )}
                title={scenario.description}
              >
                <div className="flex items-center gap-2">
                  {scenario.icon}
                  <span>{scenario.label}</span>
                  {isActive && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-4 px-1 text-[10px] bg-background/50"
                    >
                      ON
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {filterCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>{filterCount}</strong> filter{filterCount !== 1 ? 's' : ''} active. 
              Dashboard components are filtered accordingly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

