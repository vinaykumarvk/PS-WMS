/**
 * Onboarding Steps Configuration
 * Predefined tours for different parts of the application
 */

import { OnboardingTour } from '@/hooks/use-onboarding';

export const onboardingTours: Record<string, OnboardingTour> = {
  'dashboard-tour': {
    id: 'dashboard-tour',
    name: 'Dashboard Tour',
    description: 'Learn how to navigate and use the dashboard',
    steps: [
      {
        id: 'dashboard-welcome',
        target: 'body',
        title: 'Welcome to WealthRM!',
        content: 'This is your dashboard - your command center for managing clients and portfolios. Let\'s take a quick tour to get you started.',
        position: 'center',
      },
      {
        id: 'dashboard-sidebar',
        target: '[data-sidebar]',
        title: 'Navigation Sidebar',
        content: 'Use the sidebar to navigate between different sections: Clients, Prospects, Calendar, Tasks, and more. Click any item to jump to that section.',
        position: 'right',
      },
      {
        id: 'dashboard-metrics',
        target: '[data-dashboard-metrics]',
        title: 'Business Metrics',
        content: 'Here you\'ll see key performance indicators like total AUM, client count, and growth metrics. These update in real-time.',
        position: 'bottom',
      },
      {
        id: 'dashboard-quick-actions',
        target: '[data-quick-actions]',
        title: 'Quick Actions',
        content: 'Use quick actions to perform common tasks like adding a new client or creating an order. These shortcuts save you time.',
        position: 'bottom',
      },
    ],
  },
  'clients-tour': {
    id: 'clients-tour',
    name: 'Clients Management Tour',
    description: 'Learn how to manage your clients',
    steps: [
      {
        id: 'clients-overview',
        target: '[data-clients-list]',
        title: 'Clients List',
        content: 'View all your clients in one place. Each card shows key information like name, AUM, and recent activity.',
        position: 'center',
      },
      {
        id: 'clients-search',
        target: '[data-clients-search]',
        title: 'Search & Filter',
        content: 'Use the search bar to quickly find clients by name, email, or other criteria. Filters help you narrow down the list.',
        position: 'bottom',
      },
      {
        id: 'clients-add',
        target: '[data-add-client]',
        title: 'Add New Client',
        content: 'Click here to add a new client. You\'ll be guided through the onboarding process step by step.',
        position: 'top',
      },
    ],
  },
  'order-management-tour': {
    id: 'order-management-tour',
    name: 'Order Management Tour',
    description: 'Learn how to place and manage orders',
    steps: [
      {
        id: 'order-welcome',
        target: '[data-order-management]',
        title: 'Order Management',
        content: 'This is where you create and manage investment orders for your clients. You can place quick orders or build complex portfolios.',
        position: 'center',
      },
      {
        id: 'order-quick-order',
        target: '[data-quick-order]',
        title: 'Quick Order',
        content: 'Use quick order for simple, single-product orders. Perfect for common transactions.',
        position: 'bottom',
      },
      {
        id: 'order-cart',
        target: '[data-order-cart]',
        title: 'Order Cart',
        content: 'Your cart shows all products you\'re ordering. Review quantities and amounts before submitting.',
        position: 'top',
      },
      {
        id: 'order-submit',
        target: '[data-order-submit]',
        title: 'Submit Order',
        content: 'Once you\'ve reviewed everything, click submit to place the order. You\'ll receive a confirmation.',
        position: 'top',
      },
    ],
  },
  'portfolio-tour': {
    id: 'portfolio-tour',
    name: 'Portfolio Management Tour',
    description: 'Learn how to view and analyze client portfolios',
    steps: [
      {
        id: 'portfolio-overview',
        target: '[data-portfolio-overview]',
        title: 'Portfolio Overview',
        content: 'See your client\'s complete portfolio at a glance. View asset allocation, performance, and key metrics.',
        position: 'center',
      },
      {
        id: 'portfolio-charts',
        target: '[data-portfolio-charts]',
        title: 'Visual Analytics',
        content: 'Interactive charts help you understand portfolio composition and performance trends over time.',
        position: 'bottom',
      },
      {
        id: 'portfolio-holdings',
        target: '[data-portfolio-holdings]',
        title: 'Holdings Details',
        content: 'View detailed information about each holding, including current value, gains/losses, and allocation percentage.',
        position: 'top',
      },
    ],
  },
};

/**
 * Get tour by ID
 */
export function getTourById(tourId: string): OnboardingTour | undefined {
  return onboardingTours[tourId];
}

/**
 * Get all available tours
 */
export function getAllTours(): OnboardingTour[] {
  return Object.values(onboardingTours);
}

/**
 * Get tours for a specific page/route
 */
export function getToursForRoute(route: string): OnboardingTour[] {
  const routeMap: Record<string, string[]> = {
    '/': ['dashboard-tour'],
    '/clients': ['clients-tour'],
    '/order-management': ['order-management-tour'],
    '/clients/portfolio': ['portfolio-tour'],
  };

  const tourIds = routeMap[route] || [];
  return tourIds.map(id => onboardingTours[id]).filter(Boolean) as OnboardingTour[];
}

