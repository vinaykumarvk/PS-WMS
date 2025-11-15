/**
 * Unified Task & Alert Hub - Utility Functions
 * 
 * Functions for transforming, calculating urgency, and managing unified items
 */

import { 
  UnifiedItem, 
  UnifiedItemType, 
  UrgencyLevel, 
  PriorityLevel,
  AlertSeverity 
} from '@/types/unified-items';
import { 
  startOfDay, 
  addDays, 
  endOfWeek, 
  addWeeks, 
  isBefore, 
  isToday, 
  addHours,
  isAfter,
  isSameDay
} from 'date-fns';

/**
 * Transform a task into a UnifiedItem
 */
export function taskToUnifiedItem(task: any, clientName?: string, prospectName?: string): UnifiedItem {
  return {
    id: `task-${task.id}`,
    type: 'task',
    sourceId: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    createdAt: new Date(task.createdAt || Date.now()),
    priority: (task.priority || 'medium') as PriorityLevel,
    urgency: calculateUrgency({
      priority: (task.priority || 'medium') as PriorityLevel,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      completed: task.completed,
    }),
    clientId: task.clientId,
    prospectId: task.prospectId,
    clientName: clientName,
    prospectName: prospectName,
    assignedTo: task.assignedTo,
    completed: task.completed,
    metadata: {
      originalTask: task,
    },
  };
}

/**
 * Transform a portfolio alert into a UnifiedItem
 */
export function alertToUnifiedItem(alert: any, clientName?: string): UnifiedItem {
  // Map severity to priority
  const priorityMap: Record<string, PriorityLevel> = {
    'critical': 'critical',
    'warning': 'high',
    'info': 'medium',
  };
  
  const priority = priorityMap[alert.severity] || 'medium';
  
  return {
    id: `alert-${alert.id}`,
    type: 'alert',
    sourceId: alert.id,
    title: alert.title,
    description: alert.description,
    createdAt: new Date(alert.createdAt || Date.now()),
    priority: priority,
    urgency: calculateUrgency({
      priority: priority,
      severity: alert.severity as AlertSeverity,
      actionRequired: alert.actionRequired,
    }),
    clientId: alert.clientId,
    clientName: clientName,
    severity: alert.severity as AlertSeverity,
    read: alert.read,
    actionRequired: alert.actionRequired,
    metadata: {
      originalAlert: alert,
    },
  };
}

/**
 * Transform an appointment into a UnifiedItem
 */
export function appointmentToUnifiedItem(
  appointment: any, 
  clientName?: string, 
  prospectName?: string
): UnifiedItem {
  return {
    id: `appointment-${appointment.id}`,
    type: 'appointment',
    sourceId: appointment.id,
    title: appointment.title,
    description: appointment.description,
    startTime: new Date(appointment.startTime),
    endTime: new Date(appointment.endTime),
    createdAt: new Date(appointment.createdAt || Date.now()),
    priority: (appointment.priority || 'medium') as PriorityLevel,
    urgency: calculateUrgency({
      priority: (appointment.priority || 'medium') as PriorityLevel,
      startTime: new Date(appointment.startTime),
    }),
    clientId: appointment.clientId,
    prospectId: appointment.prospectId,
    clientName: clientName,
    prospectName: prospectName,
    assignedTo: appointment.assignedTo,
    location: appointment.location,
    appointmentType: appointment.type as any,
    metadata: {
      originalAppointment: appointment,
    },
  };
}

/**
 * Calculate urgency level based on item properties
 */
interface UrgencyCalculationInput {
  priority: PriorityLevel;
  dueDate?: Date;
  startTime?: Date;
  completed?: boolean;
  severity?: AlertSeverity;
  actionRequired?: boolean;
}

export function calculateUrgency(input: UrgencyCalculationInput): UrgencyLevel {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const endOfThisWeek = endOfWeek(today);
  const nextWeek = addWeeks(endOfThisWeek, 1);
  
  // "Now" - Requires immediate attention
  if (
    input.priority === 'critical' ||
    (input.dueDate && isBefore(input.dueDate, today)) || // Overdue
    (input.dueDate && isToday(input.dueDate)) || // Due today
    (input.severity === 'critical' && input.actionRequired) ||
    (input.startTime && isBefore(input.startTime, addHours(now, 2))) // Starting in 2 hours
  ) {
    return 'now';
  }
  
  // "Next" - Upcoming priority items
  if (
    input.priority === 'high' ||
    (input.dueDate && isBefore(input.dueDate, endOfThisWeek) && !isBefore(input.dueDate, today)) || // Due this week
    (input.severity === 'warning' && input.actionRequired) ||
    (input.startTime && isBefore(input.startTime, nextWeek) && !isBefore(input.startTime, today)) // This week
  ) {
    return 'next';
  }
  
  // "Scheduled" - Future items
  return 'scheduled';
}

/**
 * Filter unified items based on filter criteria
 */
export function filterUnifiedItems(
  items: UnifiedItem[],
  filters: {
    urgency?: UrgencyLevel[];
    type?: UnifiedItemType[];
    priority?: PriorityLevel[];
    entityType?: 'all' | 'client' | 'prospect';
    clientId?: number;
    prospectId?: number;
    status?: 'all' | 'pending' | 'completed' | 'read';
    searchQuery?: string;
  }
): UnifiedItem[] {
  return items.filter(item => {
    // Urgency filter
    if (filters.urgency && filters.urgency.length > 0 && !filters.urgency.includes(item.urgency)) {
      return false;
    }
    
    // Type filter
    if (filters.type && filters.type.length > 0 && !filters.type.includes(item.type)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(item.priority)) {
      return false;
    }
    
    // Entity type filter
    if (filters.entityType && filters.entityType !== 'all') {
      if (filters.entityType === 'client' && !item.clientId) {
        return false;
      }
      if (filters.entityType === 'prospect' && !item.prospectId) {
        return false;
      }
    }
    
    // Client ID filter
    if (filters.clientId && item.clientId !== filters.clientId) {
      return false;
    }
    
    // Prospect ID filter
    if (filters.prospectId && item.prospectId !== filters.prospectId) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending' && (item.completed || item.read)) {
        return false;
      }
      if (filters.status === 'completed' && !item.completed) {
        return false;
      }
      if (filters.status === 'read' && !item.read) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesDescription = item.description?.toLowerCase().includes(query) || false;
      const matchesClient = item.clientName?.toLowerCase().includes(query) || false;
      const matchesProspect = item.prospectName?.toLowerCase().includes(query) || false;
      
      if (!matchesTitle && !matchesDescription && !matchesClient && !matchesProspect) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort unified items by urgency and date
 */
export function sortUnifiedItems(items: UnifiedItem[]): UnifiedItem[] {
  const urgencyOrder: Record<UrgencyLevel, number> = {
    'now': 0,
    'next': 1,
    'scheduled': 2,
  };
  
  const priorityOrder: Record<PriorityLevel, number> = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'low': 3,
  };
  
  return [...items].sort((a, b) => {
    // First by urgency
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    // Then by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by date (earliest first)
    const aDate = a.dueDate || a.startTime || a.createdAt;
    const bDate = b.dueDate || b.startTime || b.createdAt;
    return aDate.getTime() - bDate.getTime();
  });
}

/**
 * Group unified items by urgency
 */
export function groupByUrgency(items: UnifiedItem[]): Record<UrgencyLevel, UnifiedItem[]> {
  const grouped: Record<UrgencyLevel, UnifiedItem[]> = {
    'now': [],
    'next': [],
    'scheduled': [],
  };
  
  items.forEach(item => {
    grouped[item.urgency].push(item);
  });
  
  // Sort each group
  Object.keys(grouped).forEach(key => {
    grouped[key as UrgencyLevel] = sortUnifiedItems(grouped[key as UrgencyLevel]);
  });
  
  return grouped;
}

