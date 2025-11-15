/**
 * Unified Task & Alert Hub - Type Definitions
 * 
 * This file defines the unified data model for tasks, alerts, appointments, and follow-ups
 */

export type UnifiedItemType = 'task' | 'alert' | 'appointment' | 'follow-up';
export type UrgencyLevel = 'now' | 'next' | 'scheduled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Unified item interface that can represent tasks, alerts, appointments, and follow-ups
 */
export interface UnifiedItem {
  // Identity
  id: string; // Composite: "task-123" or "alert-456" or "appointment-789"
  type: UnifiedItemType;
  sourceId: number; // Original ID from source system
  
  // Content
  title: string;
  description?: string;
  
  // Timeline
  dueDate?: Date; // For tasks
  startTime?: Date; // For appointments
  endTime?: Date; // For appointments
  createdAt: Date;
  
  // Priority & Urgency (calculated)
  priority: PriorityLevel;
  urgency: UrgencyLevel; // Calculated field based on priority, dates, etc.
  
  // Ownership
  clientId?: number;
  prospectId?: number;
  clientName?: string;
  prospectName?: string;
  assignedTo?: number;
  assignedToName?: string;
  
  // Status
  completed?: boolean; // For tasks
  read?: boolean; // For alerts
  actionRequired?: boolean; // For alerts
  
  // Metadata
  severity?: AlertSeverity; // For alerts
  location?: string; // For appointments
  appointmentType?: 'meeting' | 'call' | 'email' | 'video_call' | 'other'; // For appointments
  
  // Additional metadata
  tags?: string[];
  metadata?: Record<string, any>; // For any additional type-specific data
}

/**
 * Filter options for unified items
 */
export interface UnifiedItemFilters {
  urgency?: UrgencyLevel[];
  type?: UnifiedItemType[];
  priority?: PriorityLevel[];
  entityType?: 'all' | 'client' | 'prospect';
  clientId?: number;
  prospectId?: number;
  status?: 'all' | 'pending' | 'completed' | 'read';
  dateRange?: 'today' | 'this-week' | 'this-month' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  searchQuery?: string;
}

/**
 * Bulk action options
 */
export interface BulkAction {
  type: 'complete' | 'read' | 'assign' | 'priority' | 'delete' | 'archive';
  itemIds: string[];
  params?: {
    assignedTo?: number;
    priority?: PriorityLevel;
  };
}

