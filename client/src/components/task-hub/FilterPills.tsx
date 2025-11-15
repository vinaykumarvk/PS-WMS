/**
 * Filter Pills Component
 * Phase 3: Filtering & Search Enhancement
 * 
 * Pill filters for client/prospect, status, type, and priority
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedFeedFilters } from '@/hooks/useTaskHub';

interface FilterPillsProps {
  filters: UnifiedFeedFilters;
  onFilterChange: (filters: UnifiedFeedFilters) => void;
  clients?: Array<{ id: number; fullName: string }>;
  prospects?: Array<{ id: number; fullName: string }>;
  className?: string;
}

export function FilterPills({ 
  filters, 
  onFilterChange, 
  clients = [], 
  prospects = [],
  className 
}: FilterPillsProps) {
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== 'all'
  ).length;

  const updateFilter = <K extends keyof UnifiedFeedFilters>(
    key: K,
    value: UnifiedFeedFilters[K]
  ) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof UnifiedFeedFilters) => {
    const { [key]: _, ...rest } = filters;
    onFilterChange(rest);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'completed', 'dismissed'] as const).map((status) => (
            <Button
              key={status}
              variant={filters.status === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('status', status === 'all' ? undefined : status)}
              className="h-8"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Type
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'task', 'alert', 'appointment'] as const).map((type) => (
            <Button
              key={type}
              variant={filters.type === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('type', type === 'all' ? undefined : type)}
              className="h-8"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeframe Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Timeframe
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'now', 'next', 'scheduled'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={filters.timeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('timeframe', timeframe === 'all' ? undefined : timeframe)}
              className="h-8"
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Client Filter */}
      {clients.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Client
          </label>
          <div className="flex flex-wrap gap-2">
            {clients.slice(0, 10).map((client) => (
              <Button
                key={client.id}
                variant={filters.clientId === client.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => 
                  updateFilter('clientId', filters.clientId === client.id ? undefined : client.id)
                }
                className="h-8"
              >
                {client.fullName}
                {filters.clientId === client.id && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Prospect Filter */}
      {prospects.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Prospect
          </label>
          <div className="flex flex-wrap gap-2">
            {prospects.slice(0, 10).map((prospect) => (
              <Button
                key={prospect.id}
                variant={filters.prospectId === prospect.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => 
                  updateFilter('prospectId', filters.prospectId === prospect.id ? undefined : prospect.id)
                }
                className="h-8"
              >
                {prospect.fullName}
                {filters.prospectId === prospect.id && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

