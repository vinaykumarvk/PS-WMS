# Task & Alert Hub - Quick Implementation Guide

This document provides a quick reference for implementing the unified task & alert hub, with code examples and best practices.

## Overview

The unified task & alert hub transforms the current tasks screen into a command center that:
- Surfaces items requiring attention "now," "next," and "scheduled"
- Provides timeline-based prioritization
- Offers pill filters for client/prospect
- Integrates calendar functionality
- Supports bulk actions
- Merges tasks, alerts, and follow-ups in a chronological feed

## Architecture

### Component Structure
```
client/src/
├── pages/
│   └── task-hub.tsx              # Main hub page
├── components/
│   └── task-hub/
│       ├── TimelineView.tsx       # Timeline layout
│       ├── TimelineItem.tsx        # Unified item card
│       ├── FeedView.tsx            # Chronological feed
│       ├── CalendarView.tsx         # Calendar integration
│       ├── FilterPills.tsx          # Filter controls
│       ├── SearchBar.tsx            # Enhanced search
│       ├── BulkActionBar.tsx       # Bulk operations
│       └── UrgencyBadge.tsx         # Urgency indicator
├── hooks/
│   └── useTaskHub.ts              # Hub data hook
└── services/
    └── task-alert-hub-service.ts   # Unified data service
```

### Data Flow
```
User Interaction
    ↓
React Component
    ↓
useTaskHub Hook
    ↓
API Endpoint (/api/task-hub/*)
    ↓
TaskAlertHubService
    ↓
Database (tasks, portfolio_alerts, appointments)
```

## Phase 1: Foundation Implementation

### 1.1 Database Schema Updates

```sql
-- Add urgency calculation field (can be computed, but stored for performance)
ALTER TABLE tasks ADD COLUMN urgency TEXT;

-- Add category field
ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'task';

-- Add scheduled_for to portfolio_alerts
ALTER TABLE portfolio_alerts ADD COLUMN scheduled_for TIMESTAMP;

-- Add follow_up_date to appointments
ALTER TABLE appointments ADD COLUMN follow_up_date TIMESTAMP;

-- Create index for performance
CREATE INDEX idx_tasks_urgency ON tasks(urgency, due_date);
CREATE INDEX idx_alerts_scheduled ON portfolio_alerts(scheduled_for);
CREATE INDEX idx_appointments_followup ON appointments(follow_up_date);
```

### 1.2 Unified Service Implementation

```typescript
// server/services/task-alert-hub-service.ts
import { IStorage } from '../storage';

export interface UnifiedItem {
  id: string;
  type: 'task' | 'alert' | 'appointment';
  title: string;
  description?: string;
  urgency: 'now' | 'next' | 'scheduled';
  dueDate?: Date;
  scheduledFor?: Date;
  clientId?: number;
  prospectId?: number;
  priority?: string;
  severity?: string;
  completed?: boolean;
  read?: boolean;
  createdAt: Date;
  originalId: number;
}

export class TaskAlertHubService {
  constructor(private storage: IStorage) {}

  async getUnifiedFeed(
    userId: number,
    filters?: {
      timeframe?: 'now' | 'next' | 'scheduled' | 'all';
      clientId?: number;
      prospectId?: number;
      type?: 'task' | 'alert' | 'appointment' | 'all';
      status?: 'all' | 'pending' | 'completed' | 'dismissed';
    }
  ): Promise<UnifiedItem[]> {
    // Fetch all data types
    const [tasks, alerts, appointments] = await Promise.all([
      this.storage.getTasks(userId),
      this.storage.getPortfolioAlerts(),
      this.storage.getAppointments(userId)
    ]);

    // Transform to unified format
    const unifiedItems: UnifiedItem[] = [
      ...tasks.map(this.transformTask),
      ...alerts.map(this.transformAlert),
      ...appointments.map(this.transformAppointment)
    ];

    // Calculate urgency
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
    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    if (filters?.status) {
      filtered = this.filterByStatus(filtered, filters.status);
    }

    // Sort chronologically
    return filtered.sort((a, b) => {
      const dateA = a.dueDate || a.scheduledFor || a.createdAt;
      const dateB = b.dueDate || b.scheduledFor || b.createdAt;
      return dateA.getTime() - dateB.getTime();
    });
  }

  calculateUrgency(item: UnifiedItem): 'now' | 'next' | 'scheduled' {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dueDate = item.dueDate || item.scheduledFor;
    if (!dueDate) {
      // Items without dates default to "scheduled"
      return 'scheduled';
    }

    const due = new Date(dueDate);
    const daysDiff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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

  private transformTask(task: any): UnifiedItem {
    return {
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      clientId: task.clientId,
      prospectId: task.prospectId,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.createdAt,
      originalId: task.id
    };
  }

  private transformAlert(alert: any): UnifiedItem {
    return {
      id: `alert-${alert.id}`,
      type: 'alert',
      title: alert.title,
      description: alert.description,
      scheduledFor: alert.scheduledFor,
      clientId: alert.clientId,
      severity: alert.severity,
      read: alert.read,
      createdAt: alert.createdAt,
      originalId: alert.id
    };
  }

  private transformAppointment(appointment: any): UnifiedItem {
    return {
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      title: appointment.title,
      description: appointment.description,
      dueDate: appointment.startTime,
      scheduledFor: appointment.followUpDate,
      clientId: appointment.clientId,
      prospectId: appointment.prospectId,
      priority: appointment.priority,
      createdAt: appointment.createdAt,
      originalId: appointment.id
    };
  }

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
}
```

### 1.3 API Endpoints

```typescript
// server/routes.ts additions

import { TaskAlertHubService } from './services/task-alert-hub-service';

// Initialize service
const taskHubService = new TaskAlertHubService(storage);

// Unified feed endpoint
app.get("/api/task-hub/feed", authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const filters = {
      timeframe: req.query.timeframe as any,
      clientId: req.query.clientId ? Number(req.query.clientId) : undefined,
      prospectId: req.query.prospectId ? Number(req.query.prospectId) : undefined,
      type: req.query.type as any,
      status: req.query.status as any
    };

    const feed = await taskHubService.getUnifiedFeed(userId, filters);
    res.json(feed);
  } catch (error) {
    console.error("Get unified feed error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Timeframe-specific endpoints
app.get("/api/task-hub/now", authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const items = await taskHubService.getUnifiedFeed(userId, { timeframe: 'now' });
    res.json(items);
  } catch (error) {
    console.error("Get now items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/task-hub/next", authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const items = await taskHubService.getUnifiedFeed(userId, { timeframe: 'next' });
    res.json(items);
  } catch (error) {
    console.error("Get next items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/task-hub/scheduled", authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const items = await taskHubService.getUnifiedFeed(userId, { timeframe: 'scheduled' });
    res.json(items);
  } catch (error) {
    console.error("Get scheduled items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

## Phase 2: Timeline View Implementation

### 2.1 useTaskHub Hook

```typescript
// client/src/hooks/useTaskHub.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface UnifiedItem {
  id: string;
  type: 'task' | 'alert' | 'appointment';
  title: string;
  description?: string;
  urgency: 'now' | 'next' | 'scheduled';
  dueDate?: string;
  scheduledFor?: string;
  clientId?: number;
  prospectId?: number;
  priority?: string;
  severity?: string;
  completed?: boolean;
  read?: boolean;
  createdAt: string;
  originalId: number;
}

export function useTaskHub(filters?: {
  timeframe?: 'now' | 'next' | 'scheduled' | 'all';
  clientId?: number;
  prospectId?: number;
  type?: 'task' | 'alert' | 'appointment' | 'all';
  status?: 'all' | 'pending' | 'completed' | 'dismissed';
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<UnifiedItem[]>({
    queryKey: ['/api/task-hub/feed', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.timeframe) params.append('timeframe', filters.timeframe);
      if (filters?.clientId) params.append('clientId', filters.clientId.toString());
      if (filters?.prospectId) params.append('prospectId', filters.prospectId.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/task-hub/feed?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest('PUT', `/api/tasks/${taskId}`, { completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest('PUT', `/api/portfolio-alerts/${alertId}`, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio-alerts'] });
    }
  });

  return {
    items: data || [],
    isLoading,
    error,
    completeTask: completeTaskMutation.mutate,
    dismissAlert: dismissAlertMutation.mutate
  };
}
```

### 2.2 TimelineView Component

```typescript
// client/src/components/task-hub/TimelineView.tsx
import { useTaskHub } from '@/hooks/useTaskHub';
import { TimelineItem } from './TimelineItem';
import { Skeleton } from '@/components/ui/skeleton';

export function TimelineView({ filters }: { filters?: any }) {
  const { items, isLoading } = useTaskHub(filters);

  const nowItems = items.filter(item => item.urgency === 'now');
  const nextItems = items.filter(item => item.urgency === 'next');
  const scheduledItems = items.filter(item => item.urgency === 'scheduled');

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TimelineColumn title="Now" items={nowItems} />
      <TimelineColumn title="Next" items={nextItems} />
      <TimelineColumn title="Scheduled" items={scheduledItems} />
    </div>
  );
}

function TimelineColumn({ title, items }: { title: string; items: UnifiedItem[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items</p>
        </div>
      ) : (
        items.map(item => (
          <TimelineItem key={item.id} item={item} />
        ))
      )}
    </div>
  );
}
```

### 2.3 TimelineItem Component

```typescript
// client/src/components/task-hub/TimelineItem.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrgencyBadge } from './UrgencyBadge';
import { useTaskHub } from '@/hooks/useTaskHub';
import { CheckCircle, AlertTriangle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export function TimelineItem({ item }: { item: UnifiedItem }) {
  const [expanded, setExpanded] = useState(false);
  const { completeTask, dismissAlert } = useTaskHub();

  const getIcon = () => {
    switch (item.type) {
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleQuickAction = () => {
    if (item.type === 'task' && !item.completed) {
      completeTask(item.originalId);
    } else if (item.type === 'alert' && !item.read) {
      dismissAlert(item.originalId);
    }
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate">{item.title}</h4>
            <UrgencyBadge urgency={item.urgency} />
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          {expanded && (
            <div className="mt-3 space-y-2">
              {item.description && (
                <p className="text-sm">{item.description}</p>
              )}
              {item.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleQuickAction}>
                  {item.type === 'task' ? 'Complete' : 'Dismiss'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
    </Card>
  );
}
```

## Phase 4: Bulk Actions Implementation

### 4.1 Bulk Actions API

```typescript
// server/routes.ts

app.post("/api/task-hub/bulk", authMiddleware, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { itemIds, action } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "itemIds must be a non-empty array" });
    }

    const results = [];

    for (const itemId of itemIds) {
      const [type, id] = itemId.split('-');
      const numericId = Number(id);

      try {
        switch (action) {
          case 'complete':
            if (type === 'task') {
              await storage.updateTask(numericId, { completed: true });
              results.push({ itemId, success: true });
            }
            break;
          case 'dismiss':
            if (type === 'alert') {
              await storage.updatePortfolioAlert(numericId, { read: true });
              results.push({ itemId, success: true });
            }
            break;
          case 'delete':
            if (type === 'task') {
              await storage.deleteTask(numericId);
              results.push({ itemId, success: true });
            } else if (type === 'alert') {
              await storage.deletePortfolioAlert(numericId);
              results.push({ itemId, success: true });
            }
            break;
          default:
            results.push({ itemId, success: false, error: 'Unknown action' });
        }
      } catch (error) {
        results.push({ itemId, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error("Bulk action error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### 4.2 BulkActionBar Component

```typescript
// client/src/components/task-hub/BulkActionBar.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function BulkActionBar({ 
  selectedItems, 
  onClearSelection 
}: { 
  selectedItems: string[];
  onClearSelection: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [action, setAction] = useState<string | null>(null);

  const bulkActionMutation = useMutation({
    mutationFn: async ({ itemIds, action }: { itemIds: string[]; action: string }) => {
      return apiRequest('POST', '/api/task-hub/bulk', { itemIds, action });
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.length - successCount;
      
      toast({
        title: 'Bulk action completed',
        description: `${successCount} succeeded, ${failCount} failed`
      });

      queryClient.invalidateQueries({ queryKey: ['/api/task-hub/feed'] });
      onClearSelection();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAction = (actionType: string) => {
    bulkActionMutation.mutate({ itemIds: selectedItems, action: actionType });
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleAction('complete')}>
            Complete
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAction('dismiss')}>
            Dismiss
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction('delete')}>
            Delete
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  );
}
```

## Best Practices

### Performance
- Use React Query for caching
- Implement virtual scrolling for large lists
- Debounce search inputs
- Use database indexes
- Cache frequently accessed data

### Error Handling
- Always handle network errors
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry logic where appropriate

### Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast

### Testing
- Write tests before implementation (TDD)
- Test edge cases
- Test error scenarios
- Test performance
- Maintain test coverage >85%

## Migration Strategy

1. **Feature Flag**: Use feature flag to toggle new hub
2. **Gradual Rollout**: Start with internal users
3. **Monitor**: Track errors and performance
4. **Iterate**: Fix issues based on feedback
5. **Rollout**: Gradually enable for all users

## Rollback Plan

If issues arise:
1. Disable feature flag
2. Revert database migrations (if needed)
3. Keep old endpoints active
4. Investigate issues
5. Fix and retry

