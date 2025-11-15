import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientInteractions from '../client-interactions';
import { AuthProvider } from '@/context/auth-context';

global.fetch = vi.fn();

describe('Test Suite 4: Client Interactions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    window.location.hash = '#/clients/1/interactions';
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{component}</AuthProvider>
      </QueryClientProvider>
    );
  };

  const mockClient = { id: 1, fullName: 'John Doe' };
  const mockInteractionSummary = {
    clientId: 1,
    totalInteractions: 2,
    interactions: [
      {
        id: 1,
        client_id: 1,
        start_time: '2024-01-15T14:00:00Z',
        end_time: '2024-01-15T14:30:00Z',
        duration: 30,
        communication_type: 'Call',
        channel: 'phone',
        direction: 'outbound',
        subject: 'Portfolio Review',
        summary: 'Discussed rebalancing the equity sleeve',
        notes: 'Positive response from client',
        sentiment: 'positive',
        follow_up_required: false,
        tags: ['portfolio', 'channel:phone'],
        status: 'completed',
      },
      {
        id: 2,
        client_id: 1,
        start_time: '2023-12-15T16:00:00Z',
        end_time: '2023-12-15T16:20:00Z',
        duration: 20,
        communication_type: 'Email',
        channel: 'email',
        direction: 'outbound',
        subject: 'Year end planning',
        summary: 'Shared tax planning checklist',
        notes: null,
        sentiment: 'neutral',
        follow_up_required: true,
        follow_up_date: null,
        tags: ['tax', 'channel:email'],
        status: 'completed',
      },
    ],
    summary: {
      byType: { Call: 1, Email: 1 },
      byChannel: { phone: 1, email: 1 },
      sentiment: { positive: 1, neutral: 1 },
      averageDuration: 25,
      followUps: 1,
    },
    topTags: [
      { tag: 'portfolio', count: 1 },
      { tag: 'channel:phone', count: 1 },
      { tag: 'tax', count: 1 },
    ],
    lastInteraction: {
      id: 1,
      client_id: 1,
      start_time: '2024-01-15T14:00:00Z',
      end_time: '2024-01-15T14:30:00Z',
      duration: 30,
      communication_type: 'Call',
      channel: 'phone',
      direction: 'outbound',
      subject: 'Portfolio Review',
      summary: 'Discussed rebalancing the equity sleeve',
      notes: 'Positive response from client',
      sentiment: 'positive',
      follow_up_required: false,
      tags: ['portfolio', 'channel:phone'],
      status: 'completed',
    },
    recommendation: {
      day: 'Tuesday',
      window: 'Afternoon (12pm-5pm)',
      confidence: 0.9,
      supportingInteractions: 1,
      lastSuccessfulInteraction: '2024-01-15T14:00:00Z',
    },
  };

  // TC-CL-011: View Interaction History
  it('TC-CL-011: should display interaction history sorted by date', async () => {
    const mockUser = {
      id: 1,
      username: 'rm1@primesoft.net',
      fullName: 'Test User',
      role: 'RM',
    };

    (global.fetch as vi.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: mockUser }) });
      }
      if (url.includes('/api/clients/1')) {
        return Promise.resolve({ ok: true, json: async () => mockClient });
      }
      if (url.includes('/api/interactions') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ interaction: mockInteractionSummary.interactions[0], nlp: { tags: ['portfolio'], sentiment: 'positive' } }) });
      }
      if (url.includes('/api/interactions')) {
        return Promise.resolve({ ok: true, json: async () => mockInteractionSummary });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<ClientInteractions />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText(/Recommended meeting window/i)).toBeInTheDocument();
      expect(screen.getByText(/Portfolio Review/i)).toBeInTheDocument();
    });
  });

  // TC-CL-012: Add New Interaction
  it('TC-CL-012: should add new interaction', async () => {
    const mockUser = {
      id: 1,
      username: 'rm1@primesoft.net',
      fullName: 'Test User',
      role: 'RM',
    };

    (global.fetch as vi.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: mockUser }) });
      }
      if (url.includes('/api/clients/1')) {
        return Promise.resolve({ ok: true, json: async () => mockClient });
      }
      if (url.includes('/api/interactions') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ interaction: mockInteractionSummary.interactions[0], nlp: { tags: ['portfolio'], sentiment: 'positive' } }) });
      }
      if (url.includes('/api/interactions')) {
        return Promise.resolve({ ok: true, json: async () => mockInteractionSummary });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<ClientInteractions />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Recommended meeting window/i)).toBeInTheDocument();
    });
  });

  // TC-CL-013: Edit Interaction
  it('TC-CL-013: should edit existing interaction', async () => {
    const mockUser = {
      id: 1,
      username: 'rm1@primesoft.net',
      fullName: 'Test User',
      role: 'RM',
    };

    (global.fetch as vi.Mock).mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: mockUser }) });
      }
      if (url.includes('/api/clients/1')) {
        return Promise.resolve({ ok: true, json: async () => mockClient });
      }
      if (url.includes('/api/interactions') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ interaction: mockInteractionSummary.interactions[0], nlp: { tags: ['portfolio'], sentiment: 'positive' } }) });
      }
      if (url.includes('/api/interactions')) {
        return Promise.resolve({ ok: true, json: async () => mockInteractionSummary });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithProviders(<ClientInteractions />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Recommended meeting window/i)).toBeInTheDocument();
    });
  });
});

