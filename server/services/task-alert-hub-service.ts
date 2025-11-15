import { IStorage } from '../storage';
import { Task, PortfolioAlert, Appointment } from '@shared/schema';

/**
 * Unified item interface for tasks, alerts, and appointments
 */
export interface UnifiedItem {
  id: string; // Composite ID: "task-1", "alert-2", "appointment-3"
  type: 'task' | 'alert' | 'appointment';
  title: string;
  description?: string | null;
  urgency: 'now' | 'next' | 'scheduled';
  dueDate?: Date | null;
  scheduledFor?: Date | null;
  clientId?: number | null;
  prospectId?: number | null;
  priority?: string | null;
  severity?: string | null;
  completed?: boolean;
  read?: boolean;
  actionRequired?: boolean;
  createdAt: Date;
  originalId: number; // Original ID from source table
  clientName?: string | null;
  prospectName?: string | null;
}

/**
 * Filter options for unified feed
 */
export interface UnifiedFeedFilters {
  timeframe?: 'now' | 'next' | 'scheduled' | 'all';
  clientId?: number;
  prospectId?: number;
  type?: 'task' | 'alert' | 'appointment' | 'all';
  status?: 'all' | 'pending' | 'completed' | 'dismissed';
}

/**
 * Service for unified task and alert hub
 * Merges tasks, portfolio alerts, and appointments into a single chronological feed
 */
export class TaskAlertHubService {
  constructor(private storage: IStorage) {}

  /**
   * Get unified feed of tasks, alerts, and appointments
   */
  async getUnifiedFeed(
    userId: number,
    filters?: UnifiedFeedFilters
  ): Promise<UnifiedItem[]> {
    try {
      // Fetch all data types in parallel
      const [tasks, alerts, appointments] = await Promise.all([
        this.storage.getTasks(userId),
        this.storage.getPortfolioAlerts(),
        this.storage.getAppointments(userId)
      ]);

      // Transform to unified format
      const unifiedItems: UnifiedItem[] = [
        ...tasks.map(task => this.transformTask(task)),
        ...alerts.map(alert => this.transformAlert(alert)),
        ...appointments.map(appointment => this.transformAppointment(appointment))
      ];

      // Calculate urgency for each item
      unifiedItems.forEach(item => {
        item.urgency = this.calculateUrgency(item);
      });

      // Apply filters
      let filtered = unifiedItems;
      
      if (filters?.timeframe && filters.timeframe !== 'all') {
        filtered = filtered.filter(item => item.urgency === filters.timeframe);
      }
      
      if (filters?.clientId) {
        filtered = filtered.filter(item => item.clientId === filters.clientId);
      }
      
      if (filters?.prospectId) {
        filtered = filtered.filter(item => item.prospectId === filters.prospectId);
      }
      
      if (filters?.type && filters.type !== 'all') {
        filtered = filtered.filter(item => item.type === filters.type);
      }
      
      if (filters?.status && filters.status !== 'all') {
        filtered = this.filterByStatus(filtered, filters.status);
      }

      // Sort chronologically (by due date, scheduled date, or creation date)
      return filtered.sort((a, b) => {
        const dateA = this.getSortDate(a);
        const dateB = this.getSortDate(b);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error getting unified feed:', error);
      throw error;
    }
  }

  /**
   * Calculate urgency based on due date or scheduled date
   */
  calculateUrgency(item: UnifiedItem): 'now' | 'next' | 'scheduled' {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Use dueDate or scheduledFor, whichever is earlier
    const relevantDate = item.dueDate || item.scheduledFor;
    
    if (!relevantDate) {
      // Items without dates default to "scheduled"
      return 'scheduled';
    }

    const due = new Date(relevantDate);
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const daysDiff = Math.floor((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return 'now'; // Overdue
    } else if (daysDiff === 0) {
      return 'now'; // Due today
    } else if (daysDiff <= 3) {
      return 'next'; // Due within 3 days
    } else {
      return 'scheduled'; // Future
    }
  }

  /**
   * Get items by timeframe
   */
  async getItemsByTimeframe(
    userId: number,
    timeframe: 'now' | 'next' | 'scheduled',
    filters?: Omit<UnifiedFeedFilters, 'timeframe'>
  ): Promise<UnifiedItem[]> {
    return this.getUnifiedFeed(userId, { ...filters, timeframe });
  }

  /**
   * Transform task to unified item
   */
  private transformTask(task: any): UnifiedItem {
    return {
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      clientId: task.clientId || null,
      prospectId: task.prospectId || null,
      priority: task.priority || null,
      completed: task.completed || false,
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      originalId: task.id,
      clientName: task.clientName || null,
      prospectName: task.prospectName || null
    };
  }

  /**
   * Transform alert to unified item
   */
  private transformAlert(alert: any): UnifiedItem {
    return {
      id: `alert-${alert.id}`,
      type: 'alert',
      title: alert.title,
      description: alert.description,
      scheduledFor: alert.scheduledFor ? new Date(alert.scheduledFor) : null,
      clientId: alert.clientId || null,
      severity: alert.severity || null,
      read: alert.read || false,
      actionRequired: alert.actionRequired !== undefined ? alert.actionRequired : true,
      createdAt: alert.createdAt ? new Date(alert.createdAt) : new Date(),
      originalId: alert.id,
      clientName: alert.clientName || null
    };
  }

  /**
   * Transform appointment to unified item
   */
  private transformAppointment(appointment: any): UnifiedItem {
    return {
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      title: appointment.title,
      description: appointment.description,
      dueDate: appointment.startTime ? new Date(appointment.startTime) : null,
      scheduledFor: appointment.followUpDate ? new Date(appointment.followUpDate) : null,
      clientId: appointment.clientId || null,
      prospectId: appointment.prospectId || null,
      priority: appointment.priority || null,
      createdAt: appointment.createdAt ? new Date(appointment.createdAt) : new Date(),
      originalId: appointment.id,
      clientName: appointment.clientName || null,
      prospectName: appointment.prospectName || null
    };
  }

  /**
   * Filter items by status
   */
  private filterByStatus(items: UnifiedItem[], status: string): UnifiedItem[] {
    switch (status) {
      case 'pending':
        return items.filter(item => 
          (item.type === 'task' && !item.completed) ||
          (item.type === 'alert' && !item.read) ||
          (item.type === 'appointment')
        );
      case 'completed':
        return items.filter(item => 
          item.type === 'task' && item.completed
        );
      case 'dismissed':
        return items.filter(item => 
          item.type === 'alert' && item.read
        );
      default:
        return items;
    }
  }

  /**
   * Get sort date for an item (dueDate, scheduledFor, or createdAt)
   */
  private getSortDate(item: UnifiedItem): Date {
    if (item.dueDate) {
      return new Date(item.dueDate);
    }
    if (item.scheduledFor) {
      return new Date(item.scheduledFor);
    }
    return new Date(item.createdAt);
  }
}

