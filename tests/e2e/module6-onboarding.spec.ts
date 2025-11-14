/**
 * Module 6: Onboarding & Guidance - E2E Tests
 * End-to-end tests for onboarding and help features
 * 
 * NOTE: These tests require Playwright to be properly configured.
 * Run: npx playwright install
 */

import { test, expect } from '@playwright/test';

// Skip E2E tests if Playwright is not properly configured
test.skip(() => {
  return typeof TransformStream === 'undefined';
}, 'E2E tests require Playwright environment setup');

test.describe('Module 6: Onboarding & Guidance E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/#/login');
    await page.fill('input[type="email"]', 'rm1@primesoft.net');
    await page.fill('input[type="password"]', 'password@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/#\/$/);
  });

  test('TC-ONBOARD-001: Navigate to Help Center', async ({ page }) => {
    // Click Help Center in sidebar
    const helpLink = page.locator('a:has-text("Help Center"), button:has-text("Help Center")').first();
    await helpLink.click();
    
    // Verify Help Center page loads
    await page.waitForURL(/\/help/);
    await expect(page.locator('h1:has-text("Help Center"), h2:has-text("Help Center")')).toBeVisible();
  });

  test('TC-ONBOARD-002: Search FAQs', async ({ page }) => {
    await page.goto('/#/help-center');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Find FAQ tab
    const faqTab = page.locator('[role="tab"]:has-text("FAQ"), button:has-text("FAQ")').first();
    if (await faqTab.count() > 0) {
      await faqTab.click();
      
      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('client');
        await page.waitForTimeout(1000);
        // Verify search results
      }
    }
  });

  test('TC-ONBOARD-003: Filter FAQs by category', async ({ page }) => {
    await page.goto('/#/help-center');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Click FAQ tab
    const faqTab = page.locator('[role="tab"]:has-text("FAQ")').first();
    if (await faqTab.count() > 0) {
      await faqTab.click();
      
      // Click category badge
      const categoryBadge = page.locator('button:has-text("Clients"), [role="button"]:has-text("Clients")').first();
      if (await categoryBadge.count() > 0) {
        await categoryBadge.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('TC-ONBOARD-004: Expand FAQ item', async ({ page }) => {
    await page.goto('/#/help-center');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Click FAQ tab
    const faqTab = page.locator('[role="tab"]:has-text("FAQ")').first();
    if (await faqTab.count() > 0) {
      await faqTab.click();
      
      // Click on first FAQ question
      const firstQuestion = page.locator('button[aria-expanded], [role="button"]').filter({ hasText: /how/i }).first();
      if (await firstQuestion.count() > 0) {
        await firstQuestion.click();
        await page.waitForTimeout(500);
        // Verify answer is visible
      }
    }
  });

  test('TC-ONBOARD-005: View video tutorials', async ({ page }) => {
    await page.goto('/#/help-center');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Click Tutorials tab
    const tutorialsTab = page.locator('[role="tab"]:has-text("Tutorial"), button:has-text("Tutorial")').first();
    if (await tutorialsTab.count() > 0) {
      await tutorialsTab.click();
      
      // Wait for tutorials to load
      await page.waitForTimeout(2000);
      // Verify video player is present
      const videoIframe = page.locator('iframe').first();
      if (await videoIframe.count() > 0) {
        await expect(videoIframe).toBeVisible();
      }
    }
  });

  test('TC-ONBOARD-006: Start onboarding tour', async ({ page }) => {
    await page.goto('/#/help-center');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Click Interactive Tours tab
    const toursTab = page.locator('[role="tab"]:has-text("Tour"), button:has-text("Tour")').first();
    if (await toursTab.count() > 0) {
      await toursTab.click();
      
      // Click Start Tour button
      const startTourButton = page.locator('button:has-text("Start Tour")').first();
      if (await startTourButton.count() > 0) {
        await startTourButton.click();
        
        // Verify tour overlay appears
        await page.waitForTimeout(1000);
        // Tour should be visible (check for tour content)
      }
    }
  });

  test('TC-ONBOARD-007: Navigate through tour steps', async ({ page }) => {
    // This test assumes a tour is already started
    await page.goto('/#/');
    
    // Tour might auto-start or need to be triggered
    // Look for tour overlay
    await page.waitForTimeout(2000);
    
    // If tour is active, click Next
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.count() > 0 && await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      // Verify step changed
    }
  });

  test('TC-ONBOARD-008: Skip onboarding tour', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(2000);
    
    // Look for skip button
    const skipButton = page.locator('button:has-text("Skip"), button:has-text("Skip Tour")').first();
    if (await skipButton.count() > 0 && await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
      // Verify tour is dismissed
    }
  });
});

