/**
 * E2E Test Helpers - Authentication
 * Provides authentication utilities for E2E tests
 */

import { Page } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  role?: string;
}

export const TEST_USERS = {
  RM: {
    username: 'rm1@primesoft.net',
    password: 'password123',
    role: 'Relationship Manager',
  },
  ADMIN: {
    username: 'admin@primesoft.net',
    password: 'password123',
    role: 'Admin',
  },
} as const;

/**
 * Login as a test user
 */
export async function login(page: Page, user: TestUser = TEST_USERS.RM): Promise<void> {
  await page.goto('/#/login');
  await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[type="text"], input[type="email"]', user.username);
  await page.fill('input[type="password"]', user.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login page
  await page.waitForURL(/#\/(?!login)/, { timeout: 10000 });
}

/**
 * Logout
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button (adjust selector based on your UI)
  await page.click('button:has-text("Logout"), [aria-label="Logout"]');
  await page.waitForURL(/#\/login/, { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes('/login');
}

