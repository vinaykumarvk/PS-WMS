import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, MessageSquare, Phone, Video, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardFilters } from "@/context/dashboard-filter-context";
import { QuickActionsWorkflow } from "./quick-actions-workflow";

interface TimelineItem {
  id: string;
  type: 'meeting' | 'alert' | 'task';
  time: Date;
  title: string;
  description?: string;
  clientName?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  location?: string;
  metadata?: Record<string, any>;
}

interface TodaysBriefingTimelineProps {
  className?: string;
}

export function TodaysBriefingTimeline({ className }: TodaysBriefingTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { hasFilter } = useDashboardFilters();
  
  // Fetch today's appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments/today'],
  });
  
  // Fetch portfolio alerts (filter for critical/high priority)
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/portfolio-alerts'],
  });
  
  // Fetch today's tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const isLoading = appointmentsLoading || alertsLoading || tasksLoading;

  const formatTime = (dateTime: string | Date) => {
    return format(new Date(dateTime), "h:mm a");
  };

  const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Normalize and combine data into timeline items
  const buildTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Add appointments
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    safeAppointments.forEach((apt: any) => {
      const startTime = new Date(apt.startTime);
      if (startTime >= today && startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        items.push({
          id: `meeting-${apt.id}`,
          type: 'meeting',
          time: startTime,
          title: apt.title || 'Meeting',
          description: apt.description,
          clientName: apt.clientName,
          priority: apt.priority || 'medium',
          location: apt.location,
          metadata: apt
        });
      }
    });

    // Add critical/high priority alerts
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    safeAlerts
      .filter((alert: any) => {
        // Always show only critical/high priority alerts (default behavior)
        // The critical-alerts filter doesn't change this behavior since we already filter for critical
        return alert.priority === 'high' || alert.severity === 'critical';
      })
      .forEach((alert: any) => {
        items.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          time: new Date(alert.createdAt || now),
          title: alert.title || 'Portfolio Alert',
          description: alert.description,
          clientName: alert.clientName,
          priority: alert.priority || alert.severity || 'high',
          metadata: alert
        });
      });

    // Add today's tasks
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    safeTasks
      .filter((task: any) => {
        if (task.completed) return false;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        
        // If overdue-tasks filter is active, show only overdue tasks
        if (hasFilter('overdue-tasks')) {
          if (!dueDate) return false;
          return dueDate < today; // Overdue tasks
        }
        
        // Otherwise show today's tasks (default behavior)
        if (!dueDate) return false;
        return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      })
      .forEach((task: any) => {
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          time: new Date(task.dueDate),
          title: task.title || 'Task',
          description: task.description,
          priority: task.priority || 'medium',
          status: task.status,
          metadata: task
        });
      });

    // Sort by time
    return items.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getTypeIcon = (type: string, metadata?: any) => {
    switch (type) {
      case 'meeting':
        const meetingType = metadata?.type?.toLowerCase();
        if (meetingType === 'call') return <Phone className="h-4 w-4" />;
        if (meetingType === 'video') return <Video className="h-4 w-4" />;
        return <Calendar className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'task':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string, priority?: string) => {
    if (type === 'alert') {
      return priority === 'high' || priority === 'critical' 
        ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    }
    if (type === 'meeting') {
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }
    return 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800';
  };

  const timelineItems = buildTimelineItems();

  // Group items by time of day
  const groupedItems = timelineItems.reduce((acc, item) => {
    const timeOfDay = getTimeOfDay(item.time);
    if (!acc[timeOfDay]) {
      acc[timeOfDay] = [];
    }
    acc[timeOfDay].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const timeOfDayLabels = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening'
  };

  if (isLoading) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardHeader>
          <CardTitle>Today's Briefing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Briefing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your meetings, critical alerts, and tasks for today
        </p>
      </CardHeader>
      <CardContent>
        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No items scheduled for today</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([timeOfDay, items]) => (
              <div key={timeOfDay} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {timeOfDayLabels[timeOfDay as keyof typeof timeOfDayLabels]}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                {items.map((item) => {
                  const isExpanded = expandedItems.has(item.id);
                  const timeOfDay = getTimeOfDay(item.time);
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
                        getTypeColor(item.type, item.priority)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          getTypeColor(item.type, item.priority)
                        )}>
                          {getTypeIcon(item.type, item.metadata)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {item.title}
                                </span>
                                {item.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(item.time)}
                                </span>
                                {item.clientName && (
                                  <span className="truncate">{item.clientName}</span>
                                )}
                                {item.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItem(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                              {item.type === 'meeting' && item.metadata && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="ml-2 font-medium">{item.metadata.type || 'Meeting'}</span>
                                  </div>
                                  {item.metadata.endTime && (
                                    <div>
                                      <span className="text-muted-foreground">Ends:</span>
                                      <span className="ml-2 font-medium">{formatTime(item.metadata.endTime)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.type === 'alert' && item.metadata && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Severity:</span>
                                  <span className="ml-2 font-medium capitalize">{item.metadata.severity || item.priority}</span>
                                </div>
                              )}
                              {item.type === 'task' && item.metadata && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="ml-2 font-medium capitalize">{item.status || 'Pending'}</span>
                                  </div>
                                  {item.metadata.dueDate && (
                                    <div>
                                      <span className="text-muted-foreground">Due:</span>
                                      <span className="ml-2 font-medium">{formatTime(item.metadata.dueDate)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Quick Actions */}
                              <div className="pt-2 border-t border-border/50">
                                <QuickActionsWorkflow
                                  context={{
                                    clientId: item.metadata?.clientId,
                                    clientName: item.clientName,
                                    prospectId: item.metadata?.prospectId,
                                    type: item.type,
                                  }}
                                  variant="icon"
                                  size="sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

