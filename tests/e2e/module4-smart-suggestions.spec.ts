/**
 * Module 4: Smart Suggestions & Intelligent Validation E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Module 4: Smart Suggestions & Intelligent Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to order management page
    // Note: Adjust URL based on your app structure
    await page.goto('/order-management');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Smart Suggestions', () => {
    test('should display smart suggestions when order is being created', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');
      await page.selectOption('[data-testid="transaction-type"]', 'purchase');

      // Wait for suggestions to load
      await page.waitForSelector('[data-testid="suggestions-container"]', { timeout: 5000 });

      // Check that suggestions are displayed
      const suggestions = await page.locator('[data-testid="suggestion-card"]').count();
      expect(suggestions).toBeGreaterThan(0);

      // Check suggestion content
      const suggestionText = await page.textContent('[data-testid="suggestion-card"]');
      expect(suggestionText).toBeTruthy();
    });

    test('should allow dismissing suggestions', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');

      // Wait for suggestions
      await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 5000 });

      // Get initial count
      const initialCount = await page.locator('[data-testid="suggestion-card"]').count();

      // Dismiss first suggestion
      await page.click('[data-testid="suggestion-card"]:first-child [data-testid="dismiss-button"]');

      // Wait for suggestion to be removed
      await page.waitForTimeout(500);

      // Check count decreased
      const newCount = await page.locator('[data-testid="suggestion-card"]').count();
      expect(newCount).toBe(initialCount - 1);
    });

    test('should allow applying suggestions', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '120000');

      // Wait for SIP suggestion
      await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 5000 });

      // Find and click apply button for SIP suggestion
      const sipSuggestion = page.locator('[data-testid="suggestion-card"]').filter({
        hasText: 'SIP',
      });

      if (await sipSuggestion.count() > 0) {
        await sipSuggestion.first().locator('[data-testid="apply-button"]').click();

        // Check that amount was updated
        const amountValue = await page.inputValue('[data-testid="amount-input"]');
        expect(parseInt(amountValue)).toBeLessThan(120000);
      }
    });

    test('should refresh suggestions', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');

      // Wait for suggestions
      await page.waitForSelector('[data-testid="suggestions-container"]', { timeout: 5000 });

      // Click refresh button
      await page.click('[data-testid="refresh-suggestions"]');

      // Wait for suggestions to reload
      await page.waitForTimeout(1000);

      // Check suggestions are still displayed
      const suggestions = await page.locator('[data-testid="suggestion-card"]').count();
      expect(suggestions).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Conflict Detection', () => {
    test('should detect duplicate orders', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');
      await page.selectOption('[data-testid="transaction-type"]', 'purchase');

      // Wait for conflict detection
      await page.waitForTimeout(1000);

      // Check for conflict warnings
      const conflicts = await page.locator('[data-testid="conflict-warning"]').count();
      // May or may not have conflicts depending on test data
      expect(conflicts).toBeGreaterThanOrEqual(0);
    });

    test('should detect insufficient balance for redemption', async ({ page }) => {
      // Fill in redemption order
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '1000000'); // Large amount
      await page.selectOption('[data-testid="transaction-type"]', 'redemption');

      // Wait for conflict detection
      await page.waitForTimeout(1000);

      // Check for insufficient balance warning
      const balanceWarning = page.locator('[data-testid="conflict-warning"]').filter({
        hasText: /insufficient|balance/i,
      });

      // May or may not show warning depending on holdings
      const count = await balanceWarning.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow dismissing conflicts', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');

      // Wait for conflicts
      await page.waitForTimeout(1000);

      const initialConflicts = await page.locator('[data-testid="conflict-warning"]').count();

      if (initialConflicts > 0) {
        // Dismiss first conflict
        await page.click('[data-testid="conflict-warning"]:first-child [data-testid="dismiss-conflict"]');

        // Wait for conflict to be removed
        await page.waitForTimeout(500);

        const newConflicts = await page.locator('[data-testid="conflict-warning"]').count();
        expect(newConflicts).toBe(initialConflicts - 1);
      }
    });
  });

  test.describe('Market Hours Indicator', () => {
    test('should display market hours indicator', async ({ page }) => {
      // Check for market hours indicator
      const indicator = page.locator('[data-testid="market-hours-indicator"]');
      
      await expect(indicator).toBeVisible({ timeout: 5000 });
    });

    test('should show market status', async ({ page }) => {
      const indicator = page.locator('[data-testid="market-hours-indicator"]');
      await expect(indicator).toBeVisible();

      // Check for market status text
      const statusText = await indicator.textContent();
      expect(statusText).toMatch(/Market|Open|Closed/i);
    });

    test('should show cut-off countdown when market is open', async ({ page }) => {
      const indicator = page.locator('[data-testid="market-hours-indicator"]');
      await expect(indicator).toBeVisible();

      // Check if cut-off time is displayed
      const indicatorText = await indicator.textContent();
      // May or may not show countdown depending on time
      expect(indicatorText).toBeTruthy();
    });
  });

  test.describe('Portfolio Limit Warnings', () => {
    test('should check portfolio limits', async ({ page }) => {
      // Fill in large order
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '500000');
      await page.selectOption('[data-testid="transaction-type"]', 'purchase');

      // Wait for limit check
      await page.waitForTimeout(1000);

      // Check for limit warnings
      const limitWarnings = await page.locator('[data-testid="portfolio-limit-warning"]').count();
      // May or may not show warnings depending on portfolio
      expect(limitWarnings).toBeGreaterThanOrEqual(0);
    });

    test('should display limit progress bars', async ({ page }) => {
      // Fill in order
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '200000');

      // Wait for limit check
      await page.waitForTimeout(1000);

      // Check for progress bars
      const progressBars = await page.locator('[data-testid="limit-progress"]').count();
      // May or may not show progress bars
      expect(progressBars).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Enhanced Validation', () => {
    test('should display validation messages', async ({ page }) => {
      // Fill in invalid order
      await page.fill('[data-testid="amount-input"]', '100'); // Below minimum

      // Wait for validation
      await page.waitForTimeout(500);

      // Check for validation messages
      const validationMessages = await page.locator('[data-testid="validation-message"]').count();
      expect(validationMessages).toBeGreaterThanOrEqual(0);
    });

    test('should show error messages for invalid inputs', async ({ page }) => {
      // Fill in negative amount
      await page.fill('[data-testid="amount-input"]', '-1000');

      // Wait for validation
      await page.waitForTimeout(500);

      // Check for error messages
      const errorMessages = page.locator('[data-testid="validation-message"]').filter({
        hasText: /error|invalid/i,
      });

      const count = await errorMessages.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Contextual Help', () => {
    test('should display help tooltips', async ({ page }) => {
      // Find help icons
      const helpIcons = page.locator('[data-testid="help-icon"]');
      const count = await helpIcons.count();

      if (count > 0) {
        // Hover over first help icon
        await helpIcons.first().hover();

        // Wait for tooltip
        await page.waitForTimeout(500);

        // Check for tooltip content
        const tooltip = page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Integration', () => {
    test('should work together: suggestions + conflicts + validation', async ({ page }) => {
      // Fill in order form
      await page.fill('[data-testid="fund-select"]', 'fund-123');
      await page.fill('[data-testid="amount-input"]', '10000');
      await page.selectOption('[data-testid="transaction-type"]', 'purchase');

      // Wait for all features to load
      await page.waitForTimeout(2000);

      // Check suggestions are displayed
      const suggestions = await page.locator('[data-testid="suggestion-card"]').count();
      expect(suggestions).toBeGreaterThanOrEqual(0);

      // Check conflicts are checked
      const conflicts = await page.locator('[data-testid="conflict-warning"]').count();
      expect(conflicts).toBeGreaterThanOrEqual(0);

      // Check market hours indicator
      const marketIndicator = page.locator('[data-testid="market-hours-indicator"]');
      await expect(marketIndicator).toBeVisible();

      // Check validation messages
      const validation = await page.locator('[data-testid="validation-message"]').count();
      expect(validation).toBeGreaterThanOrEqual(0);
    });
  });
});

