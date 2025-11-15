/**
 * Task Hub View Component
 * Phase 3: Filtering & Search Enhancement
 * 
 * Complete view with filters, search, and timeline
 */

import { useState } from 'react';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import { FilterPills } from './FilterPills';
import { SearchBar } from './SearchBar';
import { useTaskHubFilters } from '@/hooks/useTaskHubFilters';
import { useTaskHub, UnifiedItem } from '@/hooks/useTaskHub';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function TaskHubView() {
  const { filters, updateFilters, clearFilters } = useTaskHubFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [schedulingItem, setSchedulingItem] = useState<UnifiedItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch clients and prospects for filter pills
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['/api/prospects'],
  });

  // Filter items by search query (client-side)
  const { items, nowItems, nextItems, scheduledItems, isLoading } = useTaskHub(filters);

  const filterItemsBySearch = (items: UnifiedItem[], query: string): UnifiedItem[] => {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.clientName?.toLowerCase().includes(lowerQuery) ||
      item.prospectName?.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredNowItems = filterItemsBySearch(nowItems, searchQuery);
  const filteredNextItems = filterItemsBySearch(nextItems, searchQuery);
  const filteredScheduledItems = filterItemsBySearch(scheduledItems, searchQuery);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== 'all'
  ).length;

  // Schedule item mutation
  const scheduleItemMutation = useMutation({
    mutationFn: async ({ item, date }: { item: UnifiedItem; date: string }) => {
      const [type, id] = item.id.split('-');
      const numericId = Number(id);

      if (type === 'task') {
        const response = await apiRequest('PUT', `/api/tasks/${numericId}`, {
          dueDate: date
        });
        if (!response.ok) throw new Error('Failed to schedule task');
        return response.json();
      } else if (type === 'alert') {
        const response = await apiRequest('PUT', `/api/portfolio-alerts/${numericId}`, {
          scheduledFor: date
        });
        if (!response.ok) throw new Error('Failed to schedule alert');
        return response.json();
      } else {
        throw new Error('Cannot schedule appointments');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Item scheduled successfully',
      });
      setSchedulingItem(null);
      setScheduleDate('');
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-alerts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule item',
        variant: 'destructive',
      });
    },
  });

  const handleScheduleItem = (item: UnifiedItem) => {
    setSchedulingItem(item);
    const currentDate = item.dueDate || item.scheduledFor;
    if (currentDate) {
      setScheduleDate(format(new Date(currentDate), 'yyyy-MM-dd'));
    } else {
      setScheduleDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleScheduleSubmit = () => {
    if (!schedulingItem || !scheduleDate) return;
    scheduleItemMutation.mutate({ item: schedulingItem, date: scheduleDate });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified view of tasks, alerts, and appointments
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs"
                >
                  Clear all ({activeFilterCount})
                </Button>
              )}
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks, alerts, appointments..."
          />

          {/* Filter Pills */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <FilterPills
                filters={filters}
                onFilterChange={updateFilters}
                clients={clients as any}
                prospects={prospects as any}
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'timeline' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="timeline">
              <List className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Timeline or Calendar View */}
      {viewMode === 'timeline' ? (
        <>
          <TimelineView 
            filters={filters}
            items={{
              now: filteredNowItems,
              next: filteredNextItems,
              scheduled: filteredScheduledItems
            }}
            onScheduleItem={handleScheduleItem}
          />
          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredNowItems.length + filteredNextItems.length + filteredScheduledItems.length} results for "{searchQuery}"
            </div>
          )}
        </>
      ) : (
        <CalendarView
          filters={filters}
          onItemClick={(item) => {
            // Handle item click - could open details or schedule
          }}
          onScheduleItem={handleScheduleItem}
        />
      )}

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingItem} onOpenChange={(open) => !open && setSchedulingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Item</DialogTitle>
            <DialogDescription>
              Select a date to schedule {schedulingItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Schedule Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSchedulingItem(null);
                setScheduleDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={!scheduleDate || scheduleItemMutation.isPending}
            >
              {scheduleItemMutation.isPending ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

