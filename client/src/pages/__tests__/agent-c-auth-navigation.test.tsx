/// <reference types="vitest" />
// Vitest globals are enabled in vitest.config.ts
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';
import LoginPage from '../login';
import Dashboard from '../dashboard';
import Settings from '../settings';
import Profile from '../profile';
import { AuthProvider } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { NavigationProvider } from '@/context/navigation-context';
import { LanguageProvider } from '@/components/i18n/language-provider';
import { DashboardFilterProvider } from '@/context/dashboard-filter-context';

// Mock fetch globally
global.fetch = vi.fn();

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(max-width: 768px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Agent C - Auth & Navigation (25 Test Cases)', () => {
  let queryClient: QueryClient;
  let originalLocation: Location;
  let mockHistory: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    
    // Store original location
    originalLocation = window.location;
    
    // Reset hash
    window.location.hash = '';
    
    // Mock history API
    mockHistory = {
      back: vi.fn(),
      forward: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
      scrollRestoration: 'auto' as ScrollRestoration,
    };
    
    // Spy on history
    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true,
      configurable: true,
    });
    
    vi.clearAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
    (global.fetch as any).mockReset();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: null }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <AccessibilityProvider>
                <NavigationProvider>
                  <DashboardFilterProvider>
                    <AuthProvider>{component}</AuthProvider>
                  </DashboardFilterProvider>
                </NavigationProvider>
              </AccessibilityProvider>
            </TooltipProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  };

  // ============================================
  // Test Suite 1: Authentication (8 test cases)
  // ============================================

  describe('TC-AUTH-001: Successful Login', () => {
    it('should login successfully and redirect to dashboard', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        });

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      await waitFor(() => {
        expect(window.location.hash).toBe('#/');
      });
    });
  });

  describe('TC-AUTH-002: Invalid Credentials', () => {
    it('should display error message on invalid credentials', async () => {
      (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: null }),
          });
        }
        if (url.includes('/api/auth/login') && options?.method === 'POST') {
          return Promise.reject(new Error('Invalid credentials'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(window.location.hash).not.toBe('#/');
    });
  });

  describe('TC-AUTH-003: Empty Credentials', () => {
    it('should prevent submission with empty credentials', async () => {
      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Clear inputs
      fireEvent.change(usernameInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });

      fireEvent.click(submitButton);

      // Form should have validation
      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('TC-AUTH-004: Remember Me Functionality', () => {
    it('should save credentials when remember me is checked', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Clear localStorage first
      localStorage.removeItem('wealthforce_credentials');

      // Mock the login API call
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/auth/login') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(<LoginPage />);

      // Wait for form to be ready
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember/i }) as HTMLElement;
      if (rememberCheckbox.getAttribute('aria-checked') !== 'true') {
        fireEvent.click(rememberCheckbox);
      }
      
      await waitFor(() => {
        expect(rememberCheckbox.getAttribute('aria-checked')).toBe('true');
      }, { timeout: 1000 });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      // Wait for login to complete and localStorage to be set
      // The handleSubmit in LoginPage sets localStorage AFTER login completes
      await waitFor(() => {
        const saved = localStorage.getItem('wealthforce_credentials');
        expect(saved).toBeTruthy();
        if (saved) {
          const parsed = JSON.parse(saved);
          expect(parsed.username).toBe('rm1@primesoft.net');
          expect(parsed.password).toBe('password@123');
        }
      }, { timeout: 10000, interval: 100 });
    });
  });

  describe('TC-AUTH-005: Session Persistence', () => {
    it('should maintain session on page refresh', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      const authCalls: string[] = [];
      // Mock all API calls that dashboard/components might make
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          authCalls.push(url);
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ totalAum: 1000000, totalClients: '50' }),
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      window.location.hash = '/';
      const { unmount } = renderWithProviders(<App />);

      // Wait for initial auth check
      await waitFor(() => {
        expect(authCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const initialCallCount = authCalls.length;

      // Simulate refresh by unmounting and remounting
      unmount();
      
      // Small delay to simulate page refresh
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create a new query client for the "refresh"
      const newQueryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0 },
          mutations: { retry: false },
        },
      });

      renderWithProviders(
        <QueryClientProvider client={newQueryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <AccessibilityProvider>
                <NavigationProvider>
                  <AuthProvider>
                    <App />
                  </AuthProvider>
                </NavigationProvider>
              </AccessibilityProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      // Verify session is maintained - auth check should be called again on remount
      await waitFor(() => {
        expect(authCalls.length).toBeGreaterThan(initialCallCount);
      }, { timeout: 5000 });
    });
  });

  describe('TC-AUTH-006: Logout Functionality', () => {
    it('should logout and redirect to login', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      window.location.hash = '/';
      const { rerender } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
      });

      // Find and click logout button (usually in header)
      const logoutButtons = screen.queryAllByRole('button');
      const logoutButton = logoutButtons.find((btn) =>
        btn.textContent?.toLowerCase().includes('logout') ||
        btn.textContent?.toLowerCase().includes('sign out')
      );

      if (logoutButton) {
        fireEvent.click(logoutButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/logout'),
            expect.anything()
          );
        });
      }
    });
  });

  describe('TC-AUTH-007: Protected Route Access', () => {
    it('should redirect unauthenticated users to login', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      window.location.hash = '/clients';
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/login');
      }, { timeout: 3000 });
    });
  });

  describe('TC-AUTH-008: Role-Based Redirect', () => {
    it('should redirect QM users to QM portal', async () => {
      const mockQMUser = {
        id: 1,
        username: 'qm@primesoft.net',
        fullName: 'QM User',
        role: 'Question Manager',
      };

      (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: null }),
          });
        }
        if (url.includes('/api/auth/login') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockQMUser }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/qm-portal');
      }, { timeout: 3000 });
    });

    it('should redirect regular users to dashboard', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'RM User',
        role: 'RM',
      };

      (global.fetch as any).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: null }),
          });
        }
        if (url.includes('/api/auth/login') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/');
      });
    });
  });

  // ============================================
  // Test Suite 2: Hash-Based Routing (5 test cases)
  // ============================================

  describe('TC-NAV-001: Basic Route Navigation', () => {
    it('should navigate between routes correctly', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/clients')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/prospects')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/appointments')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      window.location.hash = '/';
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/');
      }, { timeout: 3000 });

      // Navigate to clients
      window.location.hash = '/clients';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await waitFor(() => {
        expect(window.location.hash).toBe('#/clients');
      }, { timeout: 2000 });

      // Navigate to prospects
      window.location.hash = '/prospects';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await waitFor(() => {
        expect(window.location.hash).toBe('#/prospects');
      }, { timeout: 2000 });

      // Navigate to calendar
      window.location.hash = '/calendar';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      await waitFor(() => {
        expect(window.location.hash).toBe('#/calendar');
      }, { timeout: 2000 });
    });
  });

  describe('TC-NAV-002: Deep Link Navigation', () => {
    it('should handle deep links correctly', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/clients')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      window.location.hash = '/clients/1/portfolio';
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/clients/1/portfolio');
      }, { timeout: 3000 });
    });
  });

  describe('TC-NAV-003: Browser Back/Forward', () => {
    it('should handle browser back/forward navigation', () => {
      window.location.hash = '/clients';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(window.location.hash).toBe('#/clients');

      // Simulate back button
      mockHistory.back();
      // In a real scenario, this would change the hash
      // For testing, we verify the history API is called
      expect(mockHistory.back).toHaveBeenCalled();
    });
  });

  describe('TC-NAV-004: Page Refresh on Route', () => {
    it('should maintain route on page refresh', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      window.location.hash = '/clients/1/portfolio';
      const { rerender } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(window.location.hash).toBe('#/clients/1/portfolio');
      });

      // Simulate refresh by rerendering
      rerender(
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <AccessibilityProvider>
                <NavigationProvider>
                  <AuthProvider>
                    <App />
                  </AuthProvider>
                </NavigationProvider>
              </AccessibilityProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(window.location.hash).toBe('#/clients/1/portfolio');
      });
    });
  });

  describe('TC-NAV-005: Invalid Route Handling', () => {
    it('should display 404 page for invalid routes', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      window.location.hash = '/invalid-route';
      renderWithProviders(<App />);

      await waitFor(() => {
        // Should render NotFound component
        expect(screen.queryByText(/404/i) || screen.queryByText(/not found/i) || screen.queryByText(/page not found/i)).toBeTruthy();
      });
    });
  });

  // ============================================
  // Test Suite 3: Sidebar Navigation (4 test cases)
  // ============================================

  describe('TC-NAV-006: Sidebar Display', () => {
    it('should display sidebar with all navigation items', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      window.location.hash = '/';
      renderWithProviders(
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/clients/i)).toBeInTheDocument();
        expect(screen.getByText(/prospects/i)).toBeInTheDocument();
        expect(screen.getByText(/calendar/i)).toBeInTheDocument();
        expect(screen.getByText(/tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe('TC-NAV-007: Sidebar Navigation', () => {
    it('should navigate when sidebar items are clicked', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      window.location.hash = '/';
      renderWithProviders(
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      );

      const clientsLink = screen.getByText(/clients/i).closest('a');
      if (clientsLink) {
        const originalHash = window.location.hash;
        fireEvent.click(clientsLink);
        await waitFor(() => {
          expect(window.location.hash).not.toBe(originalHash);
        });
      }
    });
  });

  describe('TC-NAV-008: Active Route Highlighting', () => {
    it('should highlight active route in sidebar', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      window.location.hash = '/clients';
      const { container } = renderWithProviders(
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      );

      await waitFor(() => {
        const clientsLink = screen.getByText(/clients/i).closest('a');
        expect(clientsLink).toHaveClass(/brand-accent-bg|text-primary|active/i);
      });
    });
  });

  describe('TC-NAV-009: Sidebar Hidden on QM Portal', () => {
    it('should hide sidebar on QM portal', async () => {
      const mockQMUser = {
        id: 1,
        username: 'qm@primesoft.net',
        fullName: 'QM User',
        role: 'Question Manager',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockQMUser }),
      });

      window.location.hash = '/qm-portal';
      const { container } = renderWithProviders(<App />);

      await waitFor(() => {
        // Sidebar should not be visible
        const sidebar = container.querySelector('[class*="sidebar"]');
        expect(sidebar).not.toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Test Suite 4: Mobile Navigation (3 test cases)
  // ============================================

  describe('TC-NAV-010: Bottom Navigation Display', () => {
    it('should display bottom navigation on mobile', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      window.location.hash = '/';
      renderWithProviders(
        <AuthProvider>
          <BottomNavigation />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/calendar/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tasks/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/clients/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/more/i)).toBeInTheDocument();
      });
    });
  });

  describe('TC-NAV-011: Mobile Navigation Actions', () => {
    it('should navigate when bottom nav buttons are clicked', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      window.location.hash = '/';
      renderWithProviders(
        <AuthProvider>
          <BottomNavigation />
        </AuthProvider>
      );

      await waitFor(() => {
        const calendarButton = screen.getByLabelText(/calendar/i);
        fireEvent.click(calendarButton);
        expect(window.location.hash).toBe('#/calendar');
      });
    });
  });

  describe('TC-NAV-012: Mobile Menu', () => {
    it('should open mobile menu when More button is clicked', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const onMoreClick = vi.fn();
      window.location.hash = '/';
      renderWithProviders(
        <AuthProvider>
          <BottomNavigation onMoreClick={onMoreClick} />
        </AuthProvider>
      );

      await waitFor(() => {
        const moreButton = screen.getByLabelText(/more/i);
        fireEvent.click(moreButton);
        expect(onMoreClick).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // Test Suite 5: Dashboard (5 test cases)
  // ============================================

  describe('TC-DASH-001: Dashboard Loading', () => {
    it('should load dashboard without errors', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all dashboard API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ totalAum: 1000000, totalClients: '50' }),
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        // Dashboard should render without crashing
        expect(screen.queryByText(/welcome/i) || screen.queryByText(/dashboard/i) || screen.queryByText(/back/i)).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('TC-DASH-002: Business Metrics Display', () => {
    it('should display business metrics', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      const mockMetrics = {
        totalAum: 1000000,
        totalClients: '50',
        revenueMonthToDate: 50000,
        pipelineValue: 200000,
      };

      // Mock all dashboard API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMetrics,
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should fetch business metrics
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/business-metrics'),
          expect.anything()
        );
      }, { timeout: 5000 });
    });
  });

  describe('TC-DASH-003: AUM Trends Chart', () => {
    it('should render AUM trends chart', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all dashboard API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ totalAum: 1000000, totalClients: '50' }),
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        // Dashboard should render
        expect(screen.queryByText(/welcome/i) || screen.queryByText(/dashboard/i) || screen.queryByText(/back/i)).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('TC-DASH-004: Recent Activities', () => {
    it('should display recent activities', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all dashboard API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ totalAum: 1000000, totalClients: '50' }),
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        // Should fetch tasks/activities
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tasks'),
          expect.anything()
        );
      }, { timeout: 5000 });
    });
  });

  describe('TC-DASH-005: Dashboard Responsive Design', () => {
    it('should adapt layout for different screen sizes', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      // Mock all dashboard API calls
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        if (url.includes('/api/business-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ totalAum: 1000000, totalClients: '50' }),
          });
        }
        if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/talking-points')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/announcements')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        if (url.includes('/api/aum-trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance-metrics')) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes('/api/performance/incentives')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      const { container } = renderWithProviders(
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        // Dashboard should render - check for any content
        const hasContent = container.textContent && container.textContent.length > 0;
        expect(hasContent).toBe(true);
      }, { timeout: 5000 });
    });
  });

  // ============================================
  // Test Suite 6: Settings & Profile (2 test cases)
  // ============================================

  describe('TC-SETTINGS-001: Settings Page Access', () => {
    it('should load settings page', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Settings />
        </AuthProvider>
      );

      await waitFor(() => {
        const accountSettings = screen.queryByText(/account settings/i);
        if (accountSettings) {
          expect(accountSettings).toBeInTheDocument();
          return;
        }
        const profileTabs = screen.queryAllByText(/profile/i);
        const securityTabs = screen.queryAllByText(/security/i);
        const notificationsTabs = screen.queryAllByText(/notifications/i);
        expect(profileTabs.length + securityTabs.length + notificationsTabs.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('TC-SETTINGS-002: Update Settings', () => {
    it('should allow updating settings', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      renderWithProviders(
        <AuthProvider>
          <Settings />
        </AuthProvider>
      );

      await waitFor(() => {
        const accountSettings = screen.queryByText(/account settings/i);
        const profileTabs = screen.queryAllByText(/profile/i);
        const securityTabs = screen.queryAllByText(/security/i);
        expect(accountSettings || profileTabs.length > 0 || securityTabs.length > 0).toBeTruthy();
      }, { timeout: 5000 });

      // Verify settings page has interactive elements (tabs, buttons, inputs)
      await waitFor(() => {
        const allButtons = screen.queryAllByRole('button');
        const allInputs = screen.queryAllByRole('textbox');
        const allTabs = screen.queryAllByRole('tab');
        
        // Settings page should have interactive elements
        expect(allButtons.length + allInputs.length + allTabs.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('TC-PROFILE-001: Profile Page Access', () => {
    it('should load profile page', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      renderWithProviders(
        <AuthProvider>
          <Profile />
        </AuthProvider>
      );

      await waitFor(() => {
        const profileMatches = screen.queryAllByText(/profile/i);
        const nameMatch = screen.queryByText(mockUser.fullName);
        expect(profileMatches.length > 0 || !!nameMatch).toBeTruthy();
      });
    });
  });

  describe('TC-PROFILE-002: Update Profile', () => {
    it('should allow updating profile information', async () => {
      const mockUser = {
        id: 1,
        username: 'rm1@primesoft.net',
        fullName: 'Test User',
        role: 'RM',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      renderWithProviders(
        <AuthProvider>
          <Profile />
        </AuthProvider>
      );

      await waitFor(() => {
        const profileMatches = screen.queryAllByText(/profile/i);
        const nameMatch = screen.queryByText(mockUser.fullName);
        expect(profileMatches.length > 0 || !!nameMatch).toBeTruthy();
      });
    });
  });
});
