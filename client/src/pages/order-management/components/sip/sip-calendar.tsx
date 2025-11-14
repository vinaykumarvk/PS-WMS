/**
 * SIP Calendar Component
 * Visual calendar view showing SIP execution dates and status
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { SIPCalendarEvent } from '../../../../../../shared/types/sip.types';

interface SIPCalendarProps {
  events: SIPCalendarEvent[];
  onDateClick?: (date: string) => void;
}

const STATUS_COLORS = {
  Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
  Failed: 'bg-red-100 text-red-800 border-red-200',
  Skipped: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function SIPCalendar({ events, onDateClick }: SIPCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateClick) {
      onDateClick(format(date, 'yyyy-MM-dd'));
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <CardTitle>SIP Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={format(currentMonth, 'yyyy-MM')}
              onValueChange={(value) => {
                const [year, month] = value.split('-').map(Number);
                setCurrentMonth(new Date(year, month - 1));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(currentMonth.getFullYear(), i);
                  return (
                    <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            modifiers={{
              hasEvents: (date) => getEventsForDate(date).length > 0,
            }}
            modifiersClassNames={{
              hasEvents: 'bg-primary/10',
            }}
          />

          <div className="grid grid-cols-7 gap-1 text-xs font-medium text-center text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[60px] p-1 border rounded cursor-pointer
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${dayEvents.length > 0 ? 'bg-primary/5' : ''}
                    hover:bg-muted/50 transition-colors
                  `}
                  onClick={() => handleDateSelect(day)}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={`text-[10px] px-1 py-0 ${STATUS_COLORS[event.status]}`}
                      >
                        {event.status === 'Scheduled' && <Clock className="h-2 w-2 mr-0.5" />}
                        {event.status === 'Completed' && <CheckCircle2 className="h-2 w-2 mr-0.5" />}
                        {event.status === 'Failed' && <XCircle className="h-2 w-2 mr-0.5" />}
                        ₹{(event.amount / 1000).toFixed(0)}K
                      </Badge>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDateEvents.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">
                  Events on {format(selectedDate!, 'MMMM dd, yyyy')}
                </h4>
                <div className="space-y-2">
                  {selectedDateEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.schemeName}</p>
                        <p className="text-xs text-muted-foreground">
                          Plan ID: {event.planId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{event.amount.toLocaleString()}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[event.status]}`}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
              <span>Has Events</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS.Scheduled}`}>
                Scheduled
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS.Completed}`}>
                Completed
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS.Failed}`}>
                Failed
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

