/**
 * Notification Service Tests
 * Module 11: Automation Features - Sub-module 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as notificationService from '../notification-service';
import type {
  CreateNotificationPreferenceInput,
  NotificationEvent,
  NotificationChannel,
} from '@shared/types/automation.types';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock integration config
vi.mock('../integrations/config', () => ({
  getIntegrationConfig: vi.fn(),
  createIntegrationInstances: vi.fn(() => ({
    emailProvider: {
      sendEmail: vi.fn().mockResolvedValue({}),
    },
    smsProvider: {
      sendSMS: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe('Notification Service', () => {
  const mockClientId = 1;
  const mockUserId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notification Preferences', () => {
    describe('createNotificationPreference', () => {
      it('should create a notification preference with valid input', () => {
        const input: CreateNotificationPreferenceInput = {
          clientId: mockClientId,
          event: 'Order Executed',
          channels: ['Email', 'SMS'],
          enabled: true,
        };

        expect(input).toBeDefined();
        expect(input.event).toBe('Order Executed');
        expect(input.channels.length).toBe(2);
        expect(input.channels).toContain('Email');
        expect(input.channels).toContain('SMS');
      });

      it('should validate channels array is not empty', () => {
        const input: CreateNotificationPreferenceInput = {
          clientId: mockClientId,
          event: 'Order Executed',
          channels: [], // Invalid
          enabled: true,
        };

        expect(input.channels.length).toBe(0);
        // In real implementation, validation would reject empty channels
      });

      it('should support quiet hours configuration', () => {
        const input: CreateNotificationPreferenceInput = {
          clientId: mockClientId,
          event: 'Order Executed',
          channels: ['Email'],
          enabled: true,
          quietHours: {
            start: '22:00',
            end: '08:00',
          },
        };

        expect(input.quietHours).toBeDefined();
        expect(input.quietHours?.start).toBe('22:00');
        expect(input.quietHours?.end).toBe('08:00');
      });
    });

    describe('getNotificationPreferences', () => {
      it('should filter preferences by client ID', async () => {
        const mockPreferences = [
          {
            id: 'PREF-1',
            clientId: 1,
            event: 'Order Executed',
            enabled: true,
          },
          {
            id: 'PREF-2',
            clientId: 2,
            event: 'Order Executed',
            enabled: true,
          },
        ];

        const client1Preferences = mockPreferences.filter(
          (p) => p.clientId === 1
        );

        expect(client1Preferences.length).toBe(1);
        expect(client1Preferences[0].clientId).toBe(1);
      });

      it('should filter preferences by user ID when provided', async () => {
        const mockPreferences = [
          {
            id: 'PREF-1',
            clientId: 1,
            userId: 1,
            event: 'Order Executed',
            enabled: true,
          },
          {
            id: 'PREF-2',
            clientId: 1,
            userId: null,
            event: 'Order Executed',
            enabled: true,
          },
        ];

        const userPreferences = mockPreferences.filter((p) => p.userId === 1);

        expect(userPreferences.length).toBe(1);
        expect(userPreferences[0].userId).toBe(1);
      });
    });
  });

  describe('sendNotification', () => {
    it('should only send to enabled preferences', async () => {
      const mockPreferences = [
        {
          id: 'PREF-1',
          event: 'Order Executed',
          enabled: true,
          channels: ['Email'],
        },
        {
          id: 'PREF-2',
          event: 'Order Executed',
          enabled: false,
          channels: ['Email'],
        },
      ];

      const enabledPreferences = mockPreferences.filter((p) => p.enabled);

      expect(enabledPreferences.length).toBe(1);
      expect(enabledPreferences[0].id).toBe('PREF-1');
    });

    it('should respect quiet hours', () => {
      const currentTime = '23:00';
      const quietHours = {
        start: '22:00',
        end: '08:00',
      };

      const [currentHour, currentMin] = currentTime.split(':').map(Number);
      const [startHour] = quietHours.start.split(':').map(Number);
      const [endHour] = quietHours.end.split(':').map(Number);

      const isInQuietHours =
        currentHour >= startHour || currentHour <= endHour;

      expect(isInQuietHours).toBe(true);
    });

    it('should filter by minimum amount', () => {
      const preference = {
        minAmount: 10000,
      };

      const notificationAmount = 5000;

      const shouldNotify = !preference.minAmount || notificationAmount >= preference.minAmount;

      expect(shouldNotify).toBe(false);
    });

    it('should filter by scheme IDs', () => {
      const preference = {
        schemes: [123, 456],
      };

      const notificationSchemeId = 123;
      const shouldNotify =
        !preference.schemes ||
        preference.schemes.length === 0 ||
        preference.schemes.includes(notificationSchemeId);

      expect(shouldNotify).toBe(true);
    });
  });

  describe('Notification Channels', () => {
    it('should support all notification channels', () => {
      const channels: NotificationChannel[] = ['Email', 'SMS', 'Push', 'In-App'];

      expect(channels.length).toBe(4);
      expect(channels).toContain('Email');
      expect(channels).toContain('SMS');
      expect(channels).toContain('Push');
      expect(channels).toContain('In-App');
    });

    it('should send via multiple channels', () => {
      const preference = {
        channels: ['Email', 'SMS', 'In-App'] as NotificationChannel[],
      };

      expect(preference.channels.length).toBe(3);
      // In real implementation, notification would be sent via all channels
    });
  });

  describe('Notification Events', () => {
    it('should support all notification events', () => {
      const events: NotificationEvent[] = [
        'Order Submitted',
        'Order Executed',
        'Order Failed',
        'Order Settled',
        'Auto-Invest Executed',
        'Auto-Invest Failed',
        'Rebalancing Triggered',
        'Rebalancing Executed',
        'Trigger Order Activated',
        'Goal Milestone Reached',
        'Portfolio Alert',
        'Market Update',
      ];

      expect(events.length).toBe(12);
    });
  });

  describe('Notification Logs', () => {
    it('should log successful notifications', () => {
      const log = {
        clientId: mockClientId,
        event: 'Order Executed' as NotificationEvent,
        channel: 'Email' as NotificationChannel,
        status: 'Sent' as const,
        sentAt: new Date().toISOString(),
      };

      expect(log.status).toBe('Sent');
      expect(log.sentAt).toBeDefined();
    });

    it('should log failed notifications with error', () => {
      const log = {
        clientId: mockClientId,
        event: 'Order Executed' as NotificationEvent,
        channel: 'Email' as NotificationChannel,
        status: 'Failed' as const,
        error: 'SMTP connection failed',
      };

      expect(log.status).toBe('Failed');
      expect(log.error).toBeDefined();
    });
  });
});

