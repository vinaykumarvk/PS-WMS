/**
 * Task Alert Hub Service Tests
 * Phase 1: Foundation & Data Layer Enhancement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskAlertHubService } from '../task-alert-hub-service';
import type { IStorage } from '../../storage';

// Mock storage
const mockStorage: Partial<IStorage> = {
  getTasks: vi.fn(),
  getPortfolioAlerts: vi.fn(),
  getAppointments: vi.fn(),
};

describe('TaskAlertHubService', () => {
  let service: TaskAlertHubService;
  const mockUserId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskAlertHubService(mockStorage as IStorage);
  });

  describe('calculateUrgency', () => {
    it('should return "now" for overdue items', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const item = {
        id: 'task-1',
        type: 'task' as const,
        title: 'Test Task',
        urgency: 'scheduled' as const,
        dueDate: yesterday,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('now');
    });

    it('should return "now" for items due today', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const item = {
        id: 'task-1',
        type: 'task' as const,
        title: 'Test Task',
        urgency: 'scheduled' as const,
        dueDate: today,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('now');
    });

    it('should return "next" for items due within 3 days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const item = {
        id: 'task-1',
        type: 'task' as const,
        title: 'Test Task',
        urgency: 'scheduled' as const,
        dueDate: tomorrow,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('next');
    });

    it('should return "scheduled" for future items', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      
      const item = {
        id: 'task-1',
        type: 'task' as const,
        title: 'Test Task',
        urgency: 'scheduled' as const,
        dueDate: future,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('scheduled');
    });

    it('should return "scheduled" for items without dates', () => {
      const item = {
        id: 'task-1',
        type: 'task' as const,
        title: 'Test Task',
        urgency: 'scheduled' as const,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('scheduled');
    });

    it('should use scheduledFor if dueDate is not available', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const item = {
        id: 'alert-1',
        type: 'alert' as const,
        title: 'Test Alert',
        urgency: 'scheduled' as const,
        scheduledFor: tomorrow,
        createdAt: new Date(),
        originalId: 1
      };

      const urgency = service.calculateUrgency(item);
      expect(urgency).toBe('next');
    });
  });

  describe('getUnifiedFeed', () => {
    it('should merge tasks, alerts, and appointments', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          dueDate: new Date(),
          completed: false,
          clientId: 1,
          priority: 'high',
          createdAt: new Date(),
        }
      ];

      const mockAlerts = [
        {
          id: 1,
          title: 'Alert 1',
          description: 'Alert description',
          clientId: 1,
          severity: 'critical',
          read: false,
          actionRequired: true,
          createdAt: new Date(),
        }
      ];

      const mockAppointments = [
        {
          id: 1,
          title: 'Appointment 1',
          description: 'Appointment description',
          startTime: new Date(),
          endTime: new Date(),
          clientId: 1,
          priority: 'medium',
          type: 'meeting',
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue(mockAlerts);
      (mockStorage.getAppointments as any).mockResolvedValue(mockAppointments);

      const feed = await service.getUnifiedFeed(mockUserId);

      expect(feed).toHaveLength(3);
      expect(feed[0].type).toBe('task');
      expect(feed[1].type).toBe('alert');
      expect(feed[2].type).toBe('appointment');
    });

    it('should filter by timeframe', async () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const future = new Date();
      future.setDate(future.getDate() + 10);

      const mockTasks = [
        {
          id: 1,
          title: 'Due Today',
          dueDate: today,
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: 'Due Tomorrow',
          dueDate: tomorrow,
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 3,
          title: 'Future Task',
          dueDate: future,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const nowItems = await service.getUnifiedFeed(mockUserId, { timeframe: 'now' });
      expect(nowItems.length).toBeGreaterThan(0);
      expect(nowItems.every(item => item.urgency === 'now')).toBe(true);
    });

    it('should filter by clientId', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task for Client 1',
          clientId: 1,
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: 'Task for Client 2',
          clientId: 2,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId, { clientId: 1 });
      expect(feed).toHaveLength(1);
      expect(feed[0].clientId).toBe(1);
    });

    it('should filter by type', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          completed: false,
          createdAt: new Date(),
        }
      ];

      const mockAlerts = [
        {
          id: 1,
          title: 'Alert 1',
          severity: 'critical',
          read: false,
          actionRequired: true,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue(mockAlerts);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId, { type: 'task' });
      expect(feed).toHaveLength(1);
      expect(feed[0].type).toBe('task');
    });

    it('should filter by status', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Pending Task',
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: 'Completed Task',
          completed: true,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const pendingFeed = await service.getUnifiedFeed(mockUserId, { status: 'pending' });
      expect(pendingFeed.every(item => 
        (item.type === 'task' && !item.completed) ||
        (item.type === 'alert' && !item.read) ||
        (item.type === 'appointment')
      )).toBe(true);

      const completedFeed = await service.getUnifiedFeed(mockUserId, { status: 'completed' });
      expect(completedFeed.every(item => item.type === 'task' && item.completed)).toBe(true);
    });

    it('should sort chronologically', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      const mockTasks = [
        {
          id: 3,
          title: 'Task 3',
          dueDate: date3,
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 1,
          title: 'Task 1',
          dueDate: date1,
          completed: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: 'Task 2',
          dueDate: date2,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId);
      expect(feed[0].title).toBe('Task 1');
      expect(feed[1].title).toBe('Task 2');
      expect(feed[2].title).toBe('Task 3');
    });

    it('should handle empty data gracefully', async () => {
      (mockStorage.getTasks as any).mockResolvedValue([]);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId);
      expect(feed).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      (mockStorage.getTasks as any).mockRejectedValue(new Error('Database error'));

      await expect(service.getUnifiedFeed(mockUserId)).rejects.toThrow('Database error');
    });
  });

  describe('getItemsByTimeframe', () => {
    it('should return items for "now" timeframe', async () => {
      const today = new Date();
      const mockTasks = [
        {
          id: 1,
          title: 'Due Today',
          dueDate: today,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const items = await service.getItemsByTimeframe(mockUserId, 'now');
      expect(items.every(item => item.urgency === 'now')).toBe(true);
    });

    it('should return items for "next" timeframe', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const mockTasks = [
        {
          id: 1,
          title: 'Due Soon',
          dueDate: tomorrow,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const items = await service.getItemsByTimeframe(mockUserId, 'next');
      expect(items.every(item => item.urgency === 'next')).toBe(true);
    });

    it('should return items for "scheduled" timeframe', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const mockTasks = [
        {
          id: 1,
          title: 'Future Task',
          dueDate: future,
          completed: false,
          createdAt: new Date(),
        }
      ];

      (mockStorage.getTasks as any).mockResolvedValue(mockTasks);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const items = await service.getItemsByTimeframe(mockUserId, 'scheduled');
      expect(items.every(item => item.urgency === 'scheduled')).toBe(true);
    });
  });

  describe('transformTask', () => {
    it('should transform task correctly', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date(),
        completed: false,
        clientId: 1,
        priority: 'high',
        createdAt: new Date(),
      };

      (mockStorage.getTasks as any).mockResolvedValue([mockTask]);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId);
      const item = feed[0];

      expect(item.id).toBe('task-1');
      expect(item.type).toBe('task');
      expect(item.title).toBe('Test Task');
      expect(item.description).toBe('Test Description');
      expect(item.originalId).toBe(1);
    });
  });

  describe('transformAlert', () => {
    it('should transform alert correctly', async () => {
      const mockAlert = {
        id: 1,
        title: 'Test Alert',
        description: 'Alert Description',
        severity: 'critical',
        read: false,
        actionRequired: true,
        clientId: 1,
        createdAt: new Date(),
      };

      (mockStorage.getTasks as any).mockResolvedValue([]);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([mockAlert]);
      (mockStorage.getAppointments as any).mockResolvedValue([]);

      const feed = await service.getUnifiedFeed(mockUserId);
      const item = feed[0];

      expect(item.id).toBe('alert-1');
      expect(item.type).toBe('alert');
      expect(item.title).toBe('Test Alert');
      expect(item.severity).toBe('critical');
      expect(item.originalId).toBe(1);
    });
  });

  describe('transformAppointment', () => {
    it('should transform appointment correctly', async () => {
      const mockAppointment = {
        id: 1,
        title: 'Test Appointment',
        description: 'Appointment Description',
        startTime: new Date(),
        endTime: new Date(),
        priority: 'medium',
        type: 'meeting',
        clientId: 1,
        createdAt: new Date(),
      };

      (mockStorage.getTasks as any).mockResolvedValue([]);
      (mockStorage.getPortfolioAlerts as any).mockResolvedValue([]);
      (mockStorage.getAppointments as any).mockResolvedValue([mockAppointment]);

      const feed = await service.getUnifiedFeed(mockUserId);
      const item = feed[0];

      expect(item.id).toBe('appointment-1');
      expect(item.type).toBe('appointment');
      expect(item.title).toBe('Test Appointment');
      expect(item.originalId).toBe(1);
    });
  });
});

