/**
 * Automation Components Tests
 * Module 11: Automation Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AutomationPage from '../index';
import AutoInvestRules from '../components/auto-invest-rules';
import RebalancingAutomation from '../components/rebalancing-automation';
import TriggerConfig from '../components/trigger-config';
import NotificationPreferences from '../components/notification-preferences';

// Mock hooks
vi.mock('../hooks/use-automation', () => ({
  useAutoInvestRules: vi.fn(() => ({
    rules: [],
    isLoading: false,
    createRule: { mutateAsync: vi.fn() },
    updateRule: { mutateAsync: vi.fn() },
    deleteRule: { mutateAsync: vi.fn() },
  })),
  useRebalancingRules: vi.fn(() => ({
    rules: [],
    isLoading: false,
    createRule: { mutateAsync: vi.fn() },
    executeRebalancing: { mutateAsync: vi.fn() },
  })),
  useTriggerOrders: vi.fn(() => ({
    orders: [],
    isLoading: false,
    createOrder: { mutateAsync: vi.fn() },
  })),
  useNotificationPreferences: vi.fn(() => ({
    preferences: [],
    isLoading: false,
    createPreference: { mutateAsync: vi.fn() },
    updatePreference: { mutateAsync: vi.fn() },
    deletePreference: { mutateAsync: vi.fn() },
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Automation Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AutomationPage', () => {
    it('should render automation page with tabs', () => {
      render(<AutomationPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Automation Features/i)).toBeInTheDocument();
      expect(screen.getByText(/Auto-Invest/i)).toBeInTheDocument();
      expect(screen.getByText(/Rebalancing/i)).toBeInTheDocument();
      expect(screen.getByText(/Triggers/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });

    it('should show message when no client selected', () => {
      // Mock window.location.hash to not have client ID
      Object.defineProperty(window, 'location', {
        value: { hash: '/automation' },
        writable: true,
      });

      render(<AutomationPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Please select a client/i)).toBeInTheDocument();
    });
  });

  describe('AutoInvestRules', () => {
    it('should render auto-invest rules component', () => {
      render(<AutoInvestRules clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Auto-Invest Rules/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Rule/i)).toBeInTheDocument();
    });

    it('should show empty state when no rules', () => {
      render(<AutoInvestRules clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/No auto-invest rules yet/i)).toBeInTheDocument();
    });

    it('should display loading state', () => {
      const { useAutoInvestRules } = require('../hooks/use-automation');
      vi.mocked(useAutoInvestRules).mockReturnValue({
        rules: [],
        isLoading: true,
        createRule: { mutateAsync: vi.fn() },
        updateRule: { mutateAsync: vi.fn() },
        deleteRule: { mutateAsync: vi.fn() },
      });

      render(<AutoInvestRules clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading auto-invest rules/i)).toBeInTheDocument();
    });
  });

  describe('RebalancingAutomation', () => {
    it('should render rebalancing automation component', () => {
      render(<RebalancingAutomation clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Rebalancing Automation/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Rule/i)).toBeInTheDocument();
    });

    it('should show empty state when no rules', () => {
      render(<RebalancingAutomation clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/No rebalancing rules yet/i)).toBeInTheDocument();
    });
  });

  describe('TriggerConfig', () => {
    it('should render trigger config component', () => {
      render(<TriggerConfig clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Trigger Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Trigger/i)).toBeInTheDocument();
    });

    it('should show empty state when no orders', () => {
      render(<TriggerConfig clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/No trigger orders yet/i)).toBeInTheDocument();
    });
  });

  describe('NotificationPreferences', () => {
    it('should render notification preferences component', () => {
      render(<NotificationPreferences clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Notification Preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Preference/i)).toBeInTheDocument();
    });

    it('should show empty state when no preferences', () => {
      render(<NotificationPreferences clientId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/No notification preferences yet/i)).toBeInTheDocument();
    });
  });
});

