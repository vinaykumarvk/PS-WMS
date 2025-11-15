import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Calendar, CheckSquare, Users, AlertCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: number;
  title: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface Task {
  id: number;
  title: string;
  priority?: string | null;
  dueDate?: string | null;
  status?: string;
  completed?: boolean;
  aiPriorityScore?: number;
  aiPriorityLabel?: "critical" | "high" | "medium" | "low";
  autoCompletePrompt?: string | null;
}

interface DealClosure {
  id: number;
  client_name: string;
  expected_amount: number;
  expected_close_date: string;
  status: string;
}

interface Alert {
  id: number;
  title: string;
  priority: string;
  clientName?: string;
}

interface Complaint {
  id: number;
  clientId: number;
  clientName: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export function ActionItemsPriorities() {
  const [isMainCardExpanded, setIsMainCardExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch today's appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments/today']
  });

  // Fetch urgent tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks']
  });

  // Fetch deal closures for this week
  const { data: dealClosures = [], isLoading: dealClosuresLoading } = useQuery({
    queryKey: ['/api/action-items/deal-closures']
  });

  // Fetch portfolio alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/portfolio-alerts']
  });

  // Fetch customer complaints
  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ['/api/complaints']
  });

  const isLoading = appointmentsLoading || tasksLoading || dealClosuresLoading || alertsLoading || complaintsLoading;

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  // Filter urgent tasks (not completed and high/medium priority)
  const urgentTasks = (tasks as Task[])
    .filter((task) => !task.completed)
    .sort((a, b) => (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0))
    .slice(0, 3);

  const priorityBadgeStyles: Record<"critical" | "high" | "medium" | "low", string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    high: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
    medium: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300",
    low: "bg-slate-100 text-slate-900 dark:bg-slate-900/30 dark:text-slate-300",
  };

  const renderPriorityBadge = (task: Task) => {
    const label = task.aiPriorityLabel ?? (task.priority as "critical" | "high" | "medium" | "low" | undefined) ?? "medium";
    const score = typeof task.aiPriorityScore === "number" ? Math.round(task.aiPriorityScore) : null;
    return (
      <Badge
        key={`priority-${task.id}`}
        variant="secondary"
        className={`text-[10px] font-semibold uppercase tracking-wide ${priorityBadgeStyles[label]}`}
      >
        AI {label}{score !== null ? ` · ${score}` : ""}
      </Badge>
    );
  };

  // Filter high priority alerts (high severity)
  const priorityAlerts = alerts.filter((alert: Alert) => 
    alert.severity === 'high' || alert.severity === 'critical'
  ).slice(0, 3);

  // Filter urgent customer complaints
  const urgentComplaints = complaints.filter((complaint: Complaint) => 
    complaint.status !== 'resolved' && (complaint.severity === 'high' || complaint.severity === 'critical')
  ).slice(0, 3);

  // This week's deal closures (expanded scope)
  const weekClosures = dealClosures.filter((closure: DealClosure) => {
    const closeDate = new Date(closure.expected_close_date);
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    return closeDate >= today && closeDate <= weekFromNow;
  });

  const sectionsConfig = {
    appointments: {
      title: 'Upcoming Meetings',
      count: appointments.length,
      items: appointments,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/30',
      description: 'Scheduled client meetings and consultations requiring preparation'
    },
    tasks: {
      title: 'Urgent Tasks',
      count: urgentTasks.length,
      items: urgentTasks,
      icon: CheckSquare,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      description: 'High-priority tasks and overdue items requiring immediate attention'
    },
    closures: {
      title: 'Expected Closures',
      count: weekClosures.length,
      items: weekClosures,
      icon: Users,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      description: 'Deal closures and prospect conversions expected this week'
    },
    complaints: {
      title: 'Customer Complaints',
      count: urgentComplaints.length,
      items: urgentComplaints,
      icon: AlertTriangle,
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      description: 'Urgent customer complaints requiring immediate resolution'
    },
    alerts: {
      title: 'Priority Alerts',
      count: priorityAlerts.length,
      items: priorityAlerts,
      icon: AlertCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/30',
      description: 'Portfolio alerts and client issues requiring immediate review'
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading today's action items...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isMainCardExpanded} onOpenChange={setIsMainCardExpanded}>
      <Card>
        <CardHeader className="hover:bg-gray-50">
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between text-left">
              <CardTitle className="text-lg">Action Items & Priorities</CardTitle>
              {isMainCardExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {Object.entries(sectionsConfig).map(([key, config]) => {
              const isExpanded = expandedSections.has(key);
              const IconComponent = config.icon;
              
              return (
                <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
                  <div className={`rounded-lg border p-3 ${config.bgColor}`}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-auto hover:bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg bg-white/60 ${config.color}`}>
                            <IconComponent size={18} />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-sm">{config.title}</h3>
                            <p className={`text-lg font-bold ${config.color}`}>
                              {config.count} {config.count === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-3">
                      <div className="text-sm text-muted-foreground mb-3">
                        {config.description}
                      </div>
                      
                      <div className="space-y-2">
                        {config.items.length === 0 ? (
                          <div className="text-sm text-muted-foreground italic">
                            No {config.title.toLowerCase()} for today
                          </div>
                        ) : (
                          config.items.map((item: any, index: number) => (
                            <div key={item.id || index} className="bg-card/70 rounded p-2 text-sm">
                              {key === 'appointments' && (
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-muted-foreground">
                                    {item.clientName} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                  </div>
                                </div>
                              )}
                              
                              {key === 'tasks' && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium">{item.title}</div>
                                    <div className="flex items-center gap-2">
                                      {renderPriorityBadge(item)}
                                      {item.dueDate && (
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(item.dueDate), 'MMM d')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {item.autoCompletePrompt && (
                                    <p className="text-xs text-primary/80">
                                      {item.autoCompletePrompt}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {key === 'closures' && (
                                <div>
                                  <div className="font-medium">{item.client_name}</div>
                                  <div className="text-muted-foreground">
                                    Expected: {formatCurrency(item.expected_amount)} • {format(new Date(item.expected_close_date), 'MMM dd')}
                                  </div>
                                </div>
                              )}
                              
                              {key === 'complaints' && (
                                <div>
                                  <div className="font-medium">{item.subject}</div>
                                  <div className="text-muted-foreground">
                                    {item.clientName} • {item.severity} • {item.status}
                                  </div>
                                </div>
                              )}
                              
                              {key === 'alerts' && (
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-muted-foreground">
                                    Priority: {item.priority}
                                    {item.clientName && ` • Client: ${item.clientName}`}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}