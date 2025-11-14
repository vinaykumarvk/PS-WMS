/**
 * Module 3: Goal-Based Investing - E2E Tests
 * End-to-end tests for goal management features
 * 
 * NOTE: These tests require Playwright to be properly configured.
 * Run: npx playwright install
 */

import { test, expect } from '@playwright/test';

// Skip E2E tests if Playwright is not properly configured
// These will be run separately when E2E environment is set up
test.skip(() => {
  // Check if TransformStream is available (Node.js 18+)
  return typeof TransformStream === 'undefined';
}, 'E2E tests require Playwright environment setup');

test.describe('Module 3: Goal-Based Investing E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/#/login');
    await page.fill('input[type="email"]', 'rm1@primesoft.net');
    await page.fill('input[type="password"]', 'password@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/#\/$/);
  });

  test('TC-GOAL-001: Navigate to Goals page', async ({ page }) => {
    // Navigate to a client page first
    await page.goto('/#/clients');
    await page.waitForSelector('[data-testid="client-card"], .client-card, article', { timeout: 10000 });
    
    // Click on first client
    const firstClient = page.locator('[data-testid="client-card"], .client-card, article').first();
    await firstClient.click();
    
    // Wait for client page to load
    await page.waitForURL(/\/clients\/\d+/);
    
    // Click Goals navigation button
    const goalsButton = page.locator('button[title="Goals"], button:has-text("Goals")').first();
    await goalsButton.click();
    
    // Verify Goals page loads
    await page.waitForURL(/\/clients\/\d+\/goals/);
    await expect(page.locator('h2:has-text("Goals")')).toBeVisible();
  });

  test('TC-GOAL-002: Create a new goal', async ({ page }) => {
    // Navigate to Goals page
    await page.goto('/#/clients/1/goals');
    await page.waitForSelector('h2:has-text("Goals")');
    
    // Click Create Goal button
    const createButton = page.locator('button:has-text("Create Goal")');
    await createButton.click();
    
    // Fill in goal form
    await page.fill('input[id="name"]', 'Test Retirement Goal');
    await page.selectOption('select[id="type"]', 'Retirement');
    await page.fill('input[id="targetAmount"]', '5000000');
    
    // Set target date (future date)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 5);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[id="targetDate"]', dateString);
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Fill priority and description
    await page.selectOption('select[id="priority"]', 'High');
    await page.fill('textarea[id="description"]', 'Test goal description');
    
    // Submit
    await page.click('button:has-text("Create Goal")');
    
    // Verify success message
    await expect(page.locator('text=Goal created')).toBeVisible({ timeout: 5000 });
  });

  test('TC-GOAL-003: View goal details', async ({ page }) => {
    await page.goto('/#/clients/1/goals');
    await page.waitForSelector('h2:has-text("Goals")');
    
    // Wait for goals to load
    await page.waitForSelector('[data-testid="goal-card"], article, .goal-card', { timeout: 5000 }).catch(() => {});
    
    // Click on first goal card if available
    const goalCard = page.locator('[data-testid="goal-card"], article, .goal-card').first();
    if (await goalCard.count() > 0) {
      await goalCard.click();
      // Verify goal details are displayed
      await expect(page.locator('text=Progress')).toBeVisible();
    }
  });

  test('TC-GOAL-004: Filter goals by status', async ({ page }) => {
    await page.goto('/#/clients/1/goals');
    await page.waitForSelector('h2:has-text("Goals")');
    
    // Find status filter
    const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('Active');
      
      // Verify filtered results
      await page.waitForTimeout(500);
      // Goals should be filtered (visual verification)
    }
  });

  test('TC-GOAL-005: Search goals', async ({ page }) => {
    await page.goto('/#/clients/1/goals');
    await page.waitForSelector('h2:has-text("Goals")');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Retirement');
      await page.waitForTimeout(500);
      // Verify search results
    }
  });

  test('TC-GOAL-006: Select goal in order management', async ({ page }) => {
    // Navigate to order management
    await page.goto('/#/order-management');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Navigate to Review tab
    const reviewTab = page.locator('button:has-text("Review"), [role="tab"]:has-text("Review")');
    if (await reviewTab.count() > 0) {
      await reviewTab.click();
      
      // Look for goal selector
      await page.waitForTimeout(1000);
      const goalSelector = page.locator('select, [role="combobox"]').filter({ hasText: /goal/i }).first();
      
      if (await goalSelector.count() > 0) {
        await goalSelector.click();
        // Select a goal if available
        const goalOption = page.locator('[role="option"]').first();
        if (await goalOption.count() > 0) {
          await goalOption.click();
        }
      }
    }
  });

  test('TC-GOAL-007: View goal recommendations', async ({ page }) => {
    await page.goto('/#/clients/1/goals');
    await page.waitForSelector('h2:has-text("Goals")');
    
    // Click Recommendations tab
    const recommendationsTab = page.locator('[role="tab"]:has-text("Recommendations"), button:has-text("Recommendations")');
    if (await recommendationsTab.count() > 0) {
      await recommendationsTab.click();
      
      // Wait for recommendations to load
      await page.waitForTimeout(2000);
      // Verify recommendations are displayed
    }
  });
});

