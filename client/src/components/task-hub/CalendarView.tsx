/**
 * Calendar View Component
 * Phase 5: Calendar Integration
 * 
 * Calendar view showing tasks, alerts, and appointments
 */

import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfDay
} from 'date-fns';
import { useTaskHub, UnifiedItem } from '@/hooks/useTaskHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UnifiedFeedFilters } from '@/hooks/useTaskHub';

interface CalendarViewProps {
  filters?: UnifiedFeedFilters;
  className?: string;
  onItemClick?: (item: UnifiedItem) => void;
  onScheduleItem?: (item: UnifiedItem, date: Date) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({ 
  filters, 
  className,
  onItemClick,
  onScheduleItem
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { items, isLoading, error } = useTaskHub(filters);

  const getItemsForDate = (date: Date): UnifiedItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return items.filter(item => {
      const itemDate = item.dueDate || item.scheduledFor;
      if (!itemDate) return false;
      const itemDateStr = format(new Date(itemDate), 'yyyy-MM-dd');
      return itemDateStr === dateStr;
    });
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'alert':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      case 'appointment':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'day' && selectedDate) {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'day' && selectedDate) {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  if (error) {
    return (
      <Card className={cn("p-8", className)}>
        <CardContent className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load calendar'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' && <MonthView 
        currentDate={currentDate}
        items={items}
        getItemsForDate={getItemsForDate}
        getItemTypeColor={getItemTypeColor}
        onDateClick={(date) => {
          setSelectedDate(date);
          setViewMode('day');
        }}
        onItemClick={onItemClick}
      />}

      {viewMode === 'week' && <WeekView
        currentDate={currentDate}
        items={items}
        getItemsForDate={getItemsForDate}
        getItemTypeColor={getItemTypeColor}
        onDateClick={(date) => {
          setSelectedDate(date);
          setViewMode('day');
        }}
        onItemClick={onItemClick}
      />}

      {viewMode === 'day' && <DayView
        date={selectedDate || currentDate}
        items={getItemsForDate(selectedDate || currentDate)}
        getItemTypeColor={getItemTypeColor}
        onItemClick={onItemClick}
        onScheduleItem={onScheduleItem}
      />}
    </div>
  );
}

function MonthView({
  currentDate,
  items,
  getItemsForDate,
  getItemTypeColor,
  onDateClick,
  onItemClick
}: {
  currentDate: Date;
  items: UnifiedItem[];
  getItemsForDate: (date: Date) => UnifiedItem[];
  getItemTypeColor: (type: string) => string;
  onDateClick: (date: Date) => void;
  onItemClick?: (item: UnifiedItem) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map(day => {
            const dayItems = getItemsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[100px] p-2 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                  !isCurrentMonth && "opacity-50",
                  isTodayDate && "ring-2 ring-primary"
                )}
                onClick={() => onDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isTodayDate && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
                    !isTodayDate && isCurrentMonth && "text-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayItems.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {dayItems.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 mt-1">
                  {dayItems.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "text-xs p-1 rounded truncate cursor-pointer",
                        getItemTypeColor(item.type)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onItemClick) {
                          onItemClick(item);
                        }
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WeekView({
  currentDate,
  items,
  getItemsForDate,
  getItemTypeColor,
  onDateClick,
  onItemClick
}: {
  currentDate: Date;
  items: UnifiedItem[];
  getItemsForDate: (date: Date) => UnifiedItem[];
  getItemTypeColor: (type: string) => string;
  onDateClick: (date: Date) => void;
  onItemClick?: (item: UnifiedItem) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayItems = getItemsForDate(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[200px] p-3 border border-border rounded-md",
                  isTodayDate && "ring-2 ring-primary bg-primary/5"
                )}
              >
                <div
                  className="font-medium mb-2 cursor-pointer hover:text-primary"
                  onClick={() => onDateClick(day)}
                >
                  <div className="text-sm text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg",
                    isTodayDate && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayItems.map(item => (
                    <Card
                      key={item.id}
                      className={cn(
                        "p-2 cursor-pointer hover:shadow-md transition-shadow",
                        getItemTypeColor(item.type)
                      )}
                      onClick={() => {
                        if (onItemClick) {
                          onItemClick(item);
                        }
                      }}
                    >
                      <div className="text-xs font-medium truncate">
                        {item.title}
                      </div>
                      {(item.dueDate || item.scheduledFor) && (
                        <div className="text-xs opacity-75 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(new Date(item.dueDate || item.scheduledFor!), 'h:mm a')}
                        </div>
                      )}
                    </Card>
                  ))}
                  {dayItems.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DayView({
  date,
  items,
  getItemTypeColor,
  onItemClick,
  onScheduleItem
}: {
  date: Date;
  items: UnifiedItem[];
  getItemTypeColor: (type: string) => string;
  onItemClick?: (item: UnifiedItem) => void;
  onScheduleItem?: (item: UnifiedItem, date: Date) => void;
}) {
  // Group items by hour
  const itemsByHour = items.reduce((acc, item) => {
    const itemDate = item.dueDate || item.scheduledFor;
    if (!itemDate) return acc;
    
    const hour = new Date(itemDate).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(item);
    return acc;
  }, {} as Record<number, UnifiedItem[]>);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hours.map(hour => {
            const hourItems = itemsByHour[hour] || [];
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const amPm = hour < 12 ? 'AM' : 'PM';

            return (
              <div key={hour} className="flex gap-4">
                <div className="w-20 text-sm font-medium text-muted-foreground pt-2">
                  {displayHour}:00 {amPm}
                </div>
                <div className="flex-1 space-y-2">
                  {hourItems.map(item => (
                    <Card
                      key={item.id}
                      className={cn(
                        "p-3 cursor-pointer hover:shadow-md transition-shadow",
                        getItemTypeColor(item.type)
                      )}
                      onClick={() => {
                        if (onItemClick) {
                          onItemClick(item);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm opacity-75 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <div className="text-xs opacity-75">
                          {format(new Date(item.dueDate || item.scheduledFor!), 'h:mm a')}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items scheduled for this day</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

